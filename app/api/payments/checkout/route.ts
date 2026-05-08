import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { createCheckout } from '@/lib/flutterwave'
import { initiatePayment as initiateOrangeMoney } from '@/lib/orange-money'

export async function POST(request: NextRequest) {
  let body: {
    professional_id: string
    service_name: string
    amount: number       // in natural currency units (XOF: 3000, EUR: 15.00)
    currency?: string
    client_name: string
    client_email: string
    client_phone?: string
    appointment_id?: string
    provider?: 'flutterwave' | 'orange_money'
    country?: string     // for Orange Money country routing
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

  const supabase = createServiceClient()
  const currency = body.currency ?? 'XOF'
  const provider = body.provider ?? 'flutterwave'

  const { data: account } = await supabase
    .from('payment_accounts')
    .select('flw_subaccount_id, onboarded, orange_merchant_number')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  // Create a pending payment record
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      professional_id,
      type: 'booking_deposit',
      amount,
      currency,
      status: 'pending',
      client_name,
      client_email,
      client_phone: body.client_phone ?? null,
      service_name,
      appointment_id: body.appointment_id ?? null,
      provider,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('[payments/checkout] Failed to create payment record', insertError)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const origin =
    request.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://kelen.africa'

  try {
    if (provider === 'orange_money') {
      const om = await initiateOrangeMoney({
        orderId: payment.id,
        amount,
        currency,
        notifUrl: `${origin}/api/orange/webhook`,
        returnUrl: `${origin}/booking/success?payment_id=${payment.id}`,
        cancelUrl: `${origin}/booking/cancel`,
        country: body.country,
      })

      // Store notif_token for webhook validation
      await supabase
        .from('payments')
        .update({ provider_session_id: om.notifToken })
        .eq('id', payment.id)

      return NextResponse.json({ checkout_url: om.paymentUrl, payment_id: payment.id })
    }

    // Default: Flutterwave
    const checkout = await createCheckout({
      txRef: payment.id,
      amount,
      currency,
      clientEmail: client_email,
      clientName: client_name,
      description: service_name,
      redirectUrl: `${origin}/booking/success?payment_id=${payment.id}`,
      subaccountId: account.flw_subaccount_id ?? undefined,
      meta: {
        professional_id,
        payment_id: payment.id,
        appointment_id: body.appointment_id ?? '',
        type: 'booking_deposit',
      },
    })

    await supabase
      .from('payments')
      .update({ provider_session_id: checkout.link })
      .eq('id', payment.id)

    return NextResponse.json({ checkout_url: checkout.link, payment_id: payment.id })
  } catch (err) {
    console.error('[payments/checkout] Provider error', String(err))
    await supabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
