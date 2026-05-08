"use server";

import { createClient } from "@/lib/supabase/server";
import { createCheckout, createPaymentPlan } from "@/lib/flutterwave";
import { revalidatePath } from "next/cache";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

// Flutterwave payment plan IDs — pre-create these in the FLW dashboard and
// store the numeric IDs in env vars. If absent, a plan is created on first use.
const PLANS = {
  pro_africa: {
    price: 3000,
    currency: "XOF",
    name: "Premium Kelen",
    flwPlanId: process.env.FLW_PLAN_PRO_AFRICA
      ? parseInt(process.env.FLW_PLAN_PRO_AFRICA, 10)
      : undefined,
  },
  pro_europe: {
    price: 15,
    currency: "EUR",
    name: "Premium Europe",
    flwPlanId: process.env.FLW_PLAN_PRO_EUROPE
      ? parseInt(process.env.FLW_PLAN_PRO_EUROPE, 10)
      : undefined,
  },
} as const;

/**
 * Create a Flutterwave checkout session for a professional subscription.
 * Returns the hosted checkout URL for redirect.
 */
export async function createCheckoutSession(
  planKey: "pro_africa" | "pro_europe"
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, email")
    .eq("user_id", user.id)
    .single();
  if (!pro) return { error: "Profil professionnel introuvable" };

  // Block if already active
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("professional_id", pro.id)
    .eq("status", "active")
    .single();
  if (existingSub) return { error: "Vous avez déjà un abonnement actif." };

  const plan = PLANS[planKey];

  try {
    let planId = plan.flwPlanId;
    if (!planId) {
      const created = await createPaymentPlan({
        name: plan.name,
        amount: plan.price,
        currency: plan.currency,
        interval: "monthly",
      });
      planId = created.id;
    }

    const txRef = `sub_${pro.id}_${Date.now()}`;
    const checkout = await createCheckout({
      txRef,
      amount: plan.price,
      currency: plan.currency,
      clientEmail: pro.email ?? user.email ?? "",
      clientName: pro.business_name,
      description: `Abonnement ${plan.name} — Kelen`,
      redirectUrl: `${baseUrl}/pro/abonnement?success=true&tx_ref=${txRef}`,
      paymentPlanId: planId,
      meta: {
        professional_id: pro.id,
        plan: planKey,
        user_id: user.id,
        type: "subscription",
      },
    });

    return { url: checkout.link };
  } catch (err) {
    console.error("[payments] createCheckoutSession", err);
    return { error: "Erreur lors de la création de la session de paiement." };
  }
}

/**
 * Get the current subscription status for the authenticated professional.
 */
export async function getSubscriptionInfo(): Promise<{
  plan: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  isPaid: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    plan: sub?.plan ?? null,
    status: sub?.status ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    isPaid: sub?.status === "active",
  };
}

/**
 * Cancel the current subscription for the authenticated professional.
 * Marks it as canceled immediately in the DB — Flutterwave stops renewing.
 */
export async function cancelSubscription(): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!pro) return { error: "Profil introuvable" };

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: true,
    })
    .eq("professional_id", pro.id)
    .in("status", ["active", "trialing"]);

  if (error) return { error: "Erreur lors de la résiliation." };

  await supabase
    .from("professionals")
    .update({ subscription_status: "cancelled" })
    .eq("id", pro.id);

  revalidatePath("/pro/abonnement");
  return { success: true };
}
