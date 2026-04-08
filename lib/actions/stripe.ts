"use server";

import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-20.basil",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

// Pricing tiers
const PLANS = {
  pro_africa: {
    price: 3000, // XOF equivalent ~€4.57 — using Stripe for simplicity
    stripePriceId: process.env.STRIPE_PRICE_PRO_AFRICA,
    name: "Premium Kelen",
    currency: "xof" as const,
  },
  pro_europe: {
    price: 1500, // €15.00 (Stripe uses cents)
    stripePriceId: process.env.STRIPE_PRICE_PRO_EUROPE,
    name: "Premium Europe",
    currency: "eur" as const,
  },
};

/**
 * Create a Stripe Checkout Session for professional subscription.
 * Returns the checkout session URL for redirect.
 */
export async function createCheckoutSession(
  planKey: "pro_africa" | "pro_europe"
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  // Get professional profile
  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, slug, email")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { error: "Profil professionnel introuvable" };

  // Check existing active subscription
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("professional_id", pro.id)
    .eq("status", "active")
    .single();

  if (existingSub) {
    // If already subscribed, go to Stripe Customer Portal
    const { data: portalSession } = await stripe.billingPortal.sessions.create({
      customer: existingSub.id, // Stripe customer ID stored in subscription
      return_url: `${baseUrl}/pro/abonnement`,
    });

    return { url: portalSession?.url };
  }

  // Create Stripe Checkout Session
  const plan = PLANS[planKey];
  if (!plan.stripePriceId) {
    return { error: `Plan ${plan.name} non configuré. Contactez le support.` };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: pro.email || user.email,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/pro/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pro/abonnement?canceled=true`,
      metadata: {
        professional_id: pro.id,
        plan: planKey,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          professional_id: pro.id,
          plan: planKey,
        },
      },
    });

    if (!session.url) {
      return { error: "Impossible de créer la session de paiement" };
    }

    return { url: session.url };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return { error: "Erreur lors de la création de la session de paiement" };
  }
}

/**
 * Handle Stripe webhook events.
 * Called by Stripe when subscription status changes.
 */
export async function handleStripeWebhook(
  signature: string,
  payload: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return { error: "Webhook secret not configured" };
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return { error: "Invalid webhook signature" };
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case "checkout.session.completed": {
      const professionalId = session.metadata?.professional_id;
      const plan = session.metadata?.plan;

      if (!professionalId || !plan) {
        console.error("Missing metadata in checkout session");
        return { error: "Missing metadata" };
      }

      // Create/update subscription record
      await supabase.from("subscriptions").upsert({
        professional_id: professionalId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        plan,
        status: "active",
        current_period_end: new Date(
          (session.expires_at || Date.now() / 1000 + 30 * 24 * 60 * 60) * 1000
        ).toISOString(),
      }, { onConflict: "professional_id" });

      // Update professional subscription tier
      await supabase
        .from("professionals")
        .update({
          subscription_tier: plan,
          subscription_status: "active",
        })
        .eq("id", professionalId);

      break;
    }

    case "customer.subscription.updated": {
      const professionalId = subscription.metadata?.professional_id;

      if (!professionalId) break;

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("stripe_subscription_id", subscription.id);

      // Update professional status if subscription canceled/expired
      if (subscription.status === "canceled" || subscription.status === "past_due") {
        await supabase
          .from("professionals")
          .update({
            subscription_status: subscription.status === "canceled" ? "cancelled" : "past_due",
          })
          .eq("id", professionalId);
      }

      break;
    }

    case "customer.subscription.deleted": {
      const professionalId = subscription.metadata?.professional_id;

      if (!professionalId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);

      await supabase
        .from("professionals")
        .update({ subscription_status: "cancelled" })
        .eq("id", professionalId);

      break;
    }
  }

  return { success: true };
}

/**
 * Get current subscription status for the authenticated professional.
 */
export async function getSubscriptionInfo(): Promise<{
  plan: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  isPaid: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { plan: null, status: null, currentPeriodEnd: null, isPaid: false };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { plan: null, status: null, currentPeriodEnd: null, isPaid: false };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("professional_id", pro.id)
    .single();

  return {
    plan: sub?.plan || null,
    status: sub?.status || null,
    currentPeriodEnd: sub?.current_period_end || null,
    isPaid: sub?.status === "active",
  };
}

/**
 * Cancel subscription via Stripe Customer Portal.
 */
export async function cancelSubscription(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { error: "Profil introuvable" };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("professional_id", pro.id)
    .single();

  if (!sub?.stripe_customer_id) {
    return { error: "Aucun abonnement actif" };
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${baseUrl}/pro/abonnement`,
    });

    return { url: portalSession.url };
  } catch (err) {
    console.error("Stripe portal error:", err);
    return { error: "Impossible d'accéder au portail de gestion" };
  }
}
