import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { notifyPaymentReceived } from "@/lib/notifications";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2026-03-25.dahlia",
}) : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle events
  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as any;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  try {
  switch (event.type) {
    case "checkout.session.completed": {
      const paymentId = session.metadata?.payment_id;

      if (paymentId) {
        // Payment session (booking deposit / invoice) — not a platform subscription
        await supabase
          .from("payments")
          .update({
            status: "paid",
            stripe_payment_intent:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            paid_at: new Date().toISOString(),
          })
          .eq("id", paymentId);

        // Fetch payment + pro details for WhatsApp
        const { data: payment } = await supabase
          .from("payments")
          .select("*, professionals(business_name, whatsapp_phone)")
          .eq("id", paymentId)
          .single();

        if (payment) {
          const pro = payment.professionals as { business_name: string; whatsapp_phone: string | null };
          notifyPaymentReceived({
            professionalId: payment.professional_id,
            paymentId: payment.id,
            appointmentId: payment.appointment_id,
            clientName: payment.client_name ?? "",
            clientPhone: payment.client_phone ?? null,
            proPhone: pro?.whatsapp_phone ?? null,
            proName: pro?.business_name ?? "",
            serviceName: payment.service_name ?? "",
            amount: `${payment.amount} ${payment.currency.toUpperCase()}`,
            paymentType: "booking_deposit",
          }).catch((err) =>
            console.error("[webhook] checkout.session.completed WhatsApp failed", String(err))
          );
        }
        break;
      }

      const professionalId = session.metadata?.professional_id;
      const plan = session.metadata?.plan;

      if (!professionalId || !plan) {
        console.error("Missing metadata in checkout session");
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

      // Fetch the actual subscription to get correct period end date
      let currentPeriodEnd: number;
      if (typeof session.subscription === 'string') {
        try {
          const stripeSubscription: any = await stripe.subscriptions.retrieve(session.subscription);
          currentPeriodEnd = stripeSubscription.current_period_end;
        } catch (err: any) {
          console.error("Failed to retrieve subscription:", err);
          currentPeriodEnd = Date.now() / 1000 + 30 * 24 * 60 * 60; // Fallback: 30 days
        }
      } else {
        currentPeriodEnd = Date.now() / 1000 + 30 * 24 * 60 * 60; // Fallback: 30 days
      }

      // Upsert subscription record
      await supabase.from("subscriptions").upsert({
        professional_id: professionalId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        plan,
        status: "active",
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      }, { onConflict: "professional_id" });

      // Update professional tier
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

    case "invoice.payment_failed": {
      const professionalId = subscription.metadata?.professional_id;
      if (!professionalId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_subscription_id", subscription.id);

      await supabase
        .from("professionals")
        .update({ subscription_status: "past_due" })
        .eq("id", professionalId);

      break;
    }

    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const piPaymentId = intent.metadata?.payment_id;
      if (!piPaymentId) break;

      await supabase
        .from("payments")
        .update({
          status: "paid",
          stripe_payment_intent: intent.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", piPaymentId);

      const { data: piPayment } = await supabase
        .from("payments")
        .select("*, professionals(business_name, whatsapp_phone)")
        .eq("id", piPaymentId)
        .single();

      if (piPayment) {
        const piPro = piPayment.professionals as { business_name: string; whatsapp_phone: string | null };
        notifyPaymentReceived({
          professionalId: piPayment.professional_id,
          paymentId: piPayment.id,
          appointmentId: piPayment.appointment_id,
          clientName: piPayment.client_name ?? "",
          clientPhone: piPayment.client_phone ?? null,
          proPhone: piPro?.whatsapp_phone ?? null,
          proName: piPro?.business_name ?? "",
          serviceName: piPayment.service_name ?? "",
          amount: `${piPayment.amount} ${piPayment.currency.toUpperCase()}`,
          paymentType: "invoice",
        }).catch((err) =>
          console.error("[webhook] payment_intent.succeeded WhatsApp failed", String(err))
        );
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const onboarded = account.details_submitted && account.charges_enabled;
      if (!onboarded) break;

      await supabase
        .from("stripe_connect_accounts")
        .update({ onboarded: true })
        .eq("stripe_account_id", account.id);

      // Denormalise onto professionals for quick lookups
      const { data: connectAccount } = await supabase
        .from("stripe_connect_accounts")
        .select("professional_id")
        .eq("stripe_account_id", account.id)
        .single();

      if (connectAccount) {
        await supabase
          .from("professionals")
          .update({ stripe_onboarded: true })
          .eq("id", connectAccount.professional_id);
      }
      break;
    }
  }
  } catch (err) {
    console.error(`[stripe/webhook] Unhandled error processing ${event.type}`, String(err));
    // Return 200 so Stripe doesn't retry — log for manual investigation
  }

  return NextResponse.json({ received: true });
}
