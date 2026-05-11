import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { verifyTransaction, verifyWebhookSignature } from '@/lib/flutterwave'
import { notifyPaymentReceived } from '@/lib/notifications'

/**
 * Flutterwave webhook — POSTs here when a payment completes.
 *
 * Setup in Flutterwave dashboard:
 *   Settings → Webhooks → URL: https://kelen.africa/api/orange-money/webhook
 *   Set a secret hash and add it as FLUTTERWAVE_WEBHOOK_SECRET in env.
 *
 * Always return 200 — Flutterwave retries on non-2xx.
 */
export async function POST(request: NextRequest) {
  const hash = request.headers.get('verif-hash')

  if (!verifyWebhookSignature(hash)) {
    console.error('[flutterwave/webhook] Invalid webhook signature')
    // Return 200 to stop retries, but don't process
    return NextResponse.json({ received: true })
  }

  let event: { event: string; data: { id: number; tx_ref: string; status: string } }

  try {
    event = await request.json()
  } catch {
    return NextResponse.json({ received: true })
  }

  // Only process charge events
  if (!event.event?.startsWith('charge.')) {
    return NextResponse.json({ received: true })
  }

  const { id: transactionId, tx_ref: paymentId, status } = event.data

  if (!paymentId || !transactionId) {
    console.error('[flutterwave/webhook] Missing tx_ref or id', event.data)
    return NextResponse.json({ received: true })
  }

  const supabase = createServiceClient()

  // Always verify with Flutterwave — never trust webhook payload alone
  let verified: Awaited<ReturnType<typeof verifyTransaction>> | null = null

  try {
    verified = await verifyTransaction(String(transactionId))
  } catch (err) {
    console.error('[flutterwave/webhook] Verification error', String(err))
    return NextResponse.json({ received: true })
  }

  if (verified.status !== 'successful') {
    await supabase
      .from('payments')
      .update({ status: 'failed', flutterwave_payment_type: verified.paymentType })
      .eq('id', paymentId)
    return NextResponse.json({ received: true })
  }

  const { data: payment, error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      flutterwave_txn_id: String(transactionId),
      flutterwave_payment_type: verified.paymentType,
      paid_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select('*, professionals(business_name, whatsapp_phone)')
    .single()

  if (updateError) {
    console.error('[flutterwave/webhook] Failed to update payment', updateError)
    return NextResponse.json({ received: true })
  }

  if (payment) {
    const pro = payment.professionals as { business_name: string; whatsapp_phone: string | null }
    notifyPaymentReceived({
      professionalId: payment.professional_id,
      paymentId: payment.id,
      appointmentId: payment.appointment_id,
      clientName: payment.client_name ?? '',
      clientPhone: payment.client_phone ?? null,
      proPhone: pro?.whatsapp_phone ?? null,
      proName: pro?.business_name ?? '',
      serviceName: payment.service_name ?? '',
      amount: `${payment.amount} ${payment.currency.toUpperCase()}`,
      paymentType: 'booking_deposit',
    }).catch((err) =>
      console.error('[flutterwave/webhook] WhatsApp notify failed', String(err))
    )
  }

  return NextResponse.json({ received: true })
}
