import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, verifyTransaction } from '@/lib/flutterwave'
import { notifyPaymentReceived } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Flutterwave sends the hash in the 'verif-hash' header
  const signature = request.headers.get('verif-hash') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[flw/webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: {
    event: string
    data: {
      id?: number
      tx_ref?: string
      status?: string
      amount?: number
      currency?: string
      customer?: { email?: string; name?: string }
      meta?: Record<string, string> | null
      plan?: { id: number; name: string }
    }
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { createClient } = await import('@/lib/supabase/service')
  const supabase = createClient()

  try {
    switch (event.event) {
      case 'charge.completed': {
        const { data } = event
        if (data.status !== 'successful') break

        // Verify the transaction independently
        if (!data.id) break
        const tx = await verifyTransaction(data.id)
        if (tx.status !== 'successful') break

        const meta = tx.meta ?? {}
        const paymentType = meta.type

        if (paymentType === 'subscription') {
          // New or renewed platform subscription
          const professionalId = meta.professional_id
          const plan = meta.plan

          if (!professionalId || !plan) break

          await supabase.from('subscriptions').upsert(
            {
              professional_id: professionalId,
              provider_subscription_id: String(tx.id),
              provider_customer_id: tx.customer?.email ?? null,
              plan,
              status: 'active',
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            { onConflict: 'professional_id' }
          )

          await supabase
            .from('professionals')
            .update({ subscription_tier: plan, subscription_status: 'active' })
            .eq('id', professionalId)

          break
        }

        if (paymentType === 'booking_deposit' || paymentType === 'invoice') {
          const paymentId = meta.payment_id
          if (!paymentId) break

          await supabase
            .from('payments')
            .update({
              status: 'paid',
              provider_tx_id: String(tx.id),
              paid_at: new Date().toISOString(),
            })
            .eq('id', paymentId)

          const { data: payment } = await supabase
            .from('payments')
            .select('*, professionals(business_name, whatsapp_phone)')
            .eq('id', paymentId)
            .single()

          if (payment) {
            const pro = payment.professionals as {
              business_name: string
              whatsapp_phone: string | null
            }
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
              paymentType: paymentType === 'booking_deposit' ? 'booking_deposit' : 'invoice',
            }).catch((err) =>
              console.error('[flw/webhook] WhatsApp notify failed', String(err))
            )
          }
        }

        break
      }

      case 'subscription.cancelled': {
        const subscriptionId = String(event.data.id ?? '')
        if (!subscriptionId) break

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('provider_subscription_id', subscriptionId)

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('professional_id')
          .eq('provider_subscription_id', subscriptionId)
          .single()

        if (sub) {
          await supabase
            .from('professionals')
            .update({ subscription_status: 'cancelled' })
            .eq('id', sub.professional_id)
        }

        break
      }

      case 'subscription.activated': {
        // Flutterwave fires this when a recurring plan is successfully activated
        const meta = event.data.meta ?? {}
        const professionalId = meta.professional_id
        const plan = meta.plan
        if (!professionalId || !plan) break

        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('professional_id', professionalId)

        break
      }
    }
  } catch (err) {
    console.error(`[flw/webhook] Error processing ${event.event}`, String(err))
    // Return 200 so Flutterwave doesn't retry — log for manual investigation
  }

  return NextResponse.json({ received: true })
}
