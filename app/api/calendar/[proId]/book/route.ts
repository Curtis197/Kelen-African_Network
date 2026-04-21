import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { createAppointment, getCalendarTokensPublic } from "@/lib/google-calendar";
import { sendClientConfirmationEmail, sendProNotificationEmail } from "@/lib/utils/calendar-email";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { createCheckoutSession } from "@/lib/stripe-connect";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params;

  let body: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    reason?: string;
    startsAt: string;
    endsAt: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { clientName, clientEmail, startsAt, endsAt } = body;
  if (!clientName || !clientEmail || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, email, whatsapp_phone")
    .eq("id", proId)
    .single();

  if (!pro) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const tokens = await getCalendarTokensPublic(proId);
  if (!tokens) {
    return NextResponse.json({ error: "Calendar not connected" }, { status: 409 });
  }

  try {
    const { googleEventId, appointmentId } = await createAppointment(proId, {
      clientName,
      clientEmail,
      clientPhone: body.clientPhone,
      reason: body.reason,
      startsAt,
      endsAt,
      proName: pro.business_name,
      proEmail: pro.email,
    });

    // Check if pro has booking-deposit payments enabled
    const { data: connectAccount } = await supabase
      .from("stripe_connect_accounts")
      .select("stripe_account_id, onboarded, payment_mode, deposit_type, deposit_amount")
      .eq("professional_id", proId)
      .single();

    const hasBookingPayments =
      connectAccount?.onboarded &&
      (connectAccount.payment_mode === "booking" || connectAccount.payment_mode === "both");

    let checkoutUrl: string | null = null;

    if (hasBookingPayments && connectAccount && connectAccount.deposit_type === "fixed") {
      const depositAmountCents = Math.round((connectAccount.deposit_amount ?? 0) * 100);

      if (depositAmountCents > 0) {
        const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;
        try {
          // Create payment record first to get ID for Stripe metadata
          const { data: paymentRecord } = await supabase
            .from("payments")
            .insert({
              professional_id: proId,
              type: "booking_deposit",
              amount: connectAccount.deposit_amount,
              currency: "eur",
              status: "pending",
              client_name: clientName,
              client_email: clientEmail,
              client_phone: body.clientPhone ?? null,
              service_name: body.reason ?? "Appointment",
              appointment_id: appointmentId ?? null,
            })
            .select("id")
            .single();

          if (paymentRecord) {
            const session = await createCheckoutSession({
              stripeAccountId: connectAccount.stripe_account_id,
              serviceName: body.reason ?? "Appointment",
              amount: depositAmountCents,
              currency: "eur",
              clientEmail,
              successUrl: `${origin}/booking/success?payment_id=${paymentRecord.id}`,
              cancelUrl: `${origin}/booking/cancel`,
              metadata: {
                professional_id: proId,
                appointment_id: appointmentId ?? "",
                payment_id: paymentRecord.id,
              },
            });
            // Save session ID back to payment record
            await supabase
              .from("payments")
              .update({ stripe_checkout_session: session.id })
              .eq("id", paymentRecord.id);
            checkoutUrl = session.url;
          }
        } catch (err) {
          console.error("[api/calendar/book] Checkout session creation failed", String(err));
          // Non-fatal — booking is confirmed, payment is optional
        }
      }
    }

    // Fire-and-forget: emails + WhatsApp
    Promise.all([
      sendClientConfirmationEmail({
        clientEmail,
        clientName,
        proName: pro.business_name,
        startsAt,
        endsAt,
        reason: body.reason,
      }),
      sendProNotificationEmail({
        proEmail: pro.email,
        proName: pro.business_name,
        clientName,
        clientEmail,
        clientPhone: body.clientPhone,
        startsAt,
        endsAt,
        reason: body.reason,
      }),
      notifyBookingConfirmed({
        professionalId: proId,
        appointmentId: appointmentId ?? null,
        clientName,
        clientPhone: body.clientPhone ?? null,
        proPhone: pro.whatsapp_phone ?? null,
        proName: pro.business_name,
        serviceName: body.reason ?? "Appointment",
        startsAt,
        withPayment: !!checkoutUrl,
      }),
    ]).catch((err) =>
      console.error("[api/calendar/book] Async notification failed", String(err))
    );

    return NextResponse.json({
      success: true,
      googleEventId,
      ...(checkoutUrl && { checkout_url: checkoutUrl }),
    });
  } catch (err) {
    console.error("[api/calendar/book] Error creating appointment", String(err));
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
