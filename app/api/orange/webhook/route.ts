import { NextRequest, NextResponse } from 'next/server'
import { validateCallback } from '@/lib/orange-money'
import { notifyPaymentReceived } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  let body: {
    notif_token?: string
    order_id?: string
    status?: string
    amount?: number
    currency?: string
    txnid?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { createClient } = await import('@/lib/supabase/service')
  const supabase = createClient()

  const paymentId = body.order_id
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  // Retrieve the stored notif_token to validate the callback
  const { data: payment } = await supabase
    .from('payments')
    .select('*, professionals(business_name, whatsapp_phone)')
    .eq('id', paymentId)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // Validate the incoming notif_token against what Orange Money gave us at initiation
  if (!validateCallback(body.notif_token ?? '', payment.provider_session_id ?? '')) {
    console.error('[orange/webhook] Invalid notif_token for payment', paymentId)
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  try {
    const omStatus = (body.status ?? '').toUpperCase()

    if (omStatus === 'SUCCESS') {
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          provider_tx_id: body.txnid ?? null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)

      const pro = payment.professionals as {
        business_name: string
        whatsapp_phone: string | null
      } | null

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
        paymentType: payment.type,
      }).catch((err) =>
        console.error('[orange/webhook] WhatsApp notify failed', String(err))
      )
    } else if (omStatus === 'FAILED' || omStatus === 'EXPIRED') {
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentId)
    }
  } catch (err) {
    console.error('[orange/webhook] Error processing callback', String(err))
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true })
}
