import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-20.basil",
});

export async function POST(request: NextRequest) {
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
  const subscription = event.data.object as Stripe.Subscription;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const professionalId = session.metadata?.professional_id;
      const plan = session.metadata?.plan;

      if (!professionalId || !plan) {
        console.error("Missing metadata in checkout session");
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

      // Upsert subscription record
      await supabase.from("subscriptions").upsert({
        professional_id: professionalId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        plan,
        status: "active",
        current_period_end: new Date(
          (session.expires_at || Date.now() / 1000 + 30 * 24 * 60 * 60) * 1000
        ).toISOString(),
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
  }

  return NextResponse.json({ received: true });
}
