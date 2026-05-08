import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { createCheckout } from '@/lib/flutterwave'
import { initiatePayment as initiateOrangeMoney } from '@/lib/orange-money'
import { notifyInvoiceSent } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    professional_id: string
    service_name: string
    amount: number       // in natural currency units
    currency?: string
    client_name: string
    client_email: string
    client_phone?: string
    provider?: 'flutterwave' | 'orange_money'
    country?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { professional_id, service_name, amount, client_name, client_email } = body
  if (!professional_id || !service_name || !amount || !client_name || !client_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()
  const currency = body.currency ?? 'XOF'
  const provider = body.provider ?? 'flutterwave'

  const { data: account } = await serviceSupabase
    .from('payment_accounts')
    .select('flw_subaccount_id, onboarded, orange_merchant_number')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  const { data: payment, error: insertError } = await serviceSupabase
    .from('payments')
    .insert({
      professional_id,
      type: 'invoice',
      amount,
      currency,
      status: 'pending',
      client_name,
      client_email,
      client_phone: body.client_phone ?? null,
      service_name,
      provider,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const origin =
    request.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://kelen.africa'

  try {
    let paymentLink: string

    if (provider === 'orange_money') {
      const om = await initiateOrangeMoney({
        orderId: payment.id,
        amount,
        currency,
        notifUrl: `${origin}/api/orange/webhook`,
        returnUrl: `${origin}/pro/paiements?payment_id=${payment.id}&status=success`,
        cancelUrl: `${origin}/pro/paiements?payment_id=${payment.id}&status=cancel`,
        country: body.country,
      })

      await serviceSupabase
        .from('payments')
        .update({ payment_link_url: om.paymentUrl, provider_session_id: om.notifToken })
        .eq('id', payment.id)

      paymentLink = om.paymentUrl
    } else {
      // Flutterwave — reusable payment link via standard checkout
      const checkout = await createCheckout({
        txRef: payment.id,
        amount,
        currency,
        clientEmail: client_email,
        clientName: client_name,
        description: service_name,
        redirectUrl: `${origin}/pro/paiements?payment_id=${payment.id}&status=success`,
        subaccountId: account.flw_subaccount_id ?? undefined,
        meta: {
          professional_id,
          payment_id: payment.id,
          type: 'invoice',
        },
      })

      await serviceSupabase
        .from('payments')
        .update({ payment_link_url: checkout.link })
        .eq('id', payment.id)

      paymentLink = checkout.link
    }

    // Fetch pro name for notification
    const { data: pro } = await serviceSupabase
      .from('professionals')
      .select('business_name')
      .eq('id', professional_id)
      .single()

    if (body.client_phone) {
      notifyInvoiceSent({
        professionalId: professional_id,
        paymentId: payment.id,
        clientName: client_name,
        clientPhone: body.client_phone,
        proName: pro?.business_name ?? '',
        amount: `${amount.toFixed(2)} ${currency.toUpperCase()}`,
        paymentLink,
      }).catch((err) => console.error('[payments/invoice] WhatsApp notify failed', String(err)))
    }

    return NextResponse.json({ payment_link: paymentLink, payment_id: payment.id })
  } catch (err) {
    console.error('[payments/invoice] Provider error', String(err))
    await serviceSupabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
