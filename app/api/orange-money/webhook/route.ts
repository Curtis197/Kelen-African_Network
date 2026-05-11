import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { getPaymentStatus } from '@/lib/orange-money'
import { notifyPaymentReceived } from '@/lib/notifications'

/**
 * CinetPay payment notification webhook.
 *
 * CinetPay sends a POST with form-encoded or JSON body containing cpm_trans_id.
 * Always return 200 — CinetPay retries on non-2xx.
 *
 * Register this URL in your CinetPay dashboard under "Notification URL".
 */
export async function POST(request: NextRequest) {
  let transactionId: string | undefined

  const contentType = request.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('application/json')) {
      const data = await request.json()
      transactionId = data.cpm_trans_id ?? data.transaction_id
    } else {
      const text = await request.text()
      const params = new URLSearchParams(text)
      transactionId = params.get('cpm_trans_id') ?? params.get('transaction_id') ?? undefined
    }
  } catch {
    console.error('[cinetpay/webhook] Failed to parse body')
    return NextResponse.json({ received: true })
  }

  if (!transactionId) {
    console.error('[cinetpay/webhook] Missing transaction ID in payload')
    return NextResponse.json({ received: true })
  }

  const supabase = createServiceClient()

  // Always verify with CinetPay — never trust webhook payload alone
  let confirmed = false
  let paymentMethod: string | null = null

  try {
    const statusResult = await getPaymentStatus(transactionId)
    confirmed = statusResult.status === 'ACCEPTED'
    paymentMethod = statusResult.paymentMethod
  } catch (err) {
    console.error('[cinetpay/webhook] Status check error', String(err))
    return NextResponse.json({ received: true })
  }

  if (!confirmed) {
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', transactionId)
    return NextResponse.json({ received: true })
  }

  const { data: payment, error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      cinetpay_payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .select('*, professionals(business_name, whatsapp_phone)')
    .single()

  if (updateError) {
    console.error('[cinetpay/webhook] Failed to update payment', updateError)
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
      amount: `${payment.amount} XOF`,
      paymentType: 'booking_deposit',
    }).catch((err) =>
      console.error('[cinetpay/webhook] WhatsApp notify failed', String(err))
    )
  }

  return NextResponse.json({ received: true })
}
