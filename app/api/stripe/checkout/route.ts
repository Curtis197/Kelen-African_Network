import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { createCheckoutSession } from '@/lib/stripe-connect'

export async function POST(request: NextRequest) {
  let body: {
    professional_id: string
    service_name: string
    amount: number
    currency?: string
    client_name: string
    client_email: string
    client_phone?: string
    appointment_id?: string
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

  const { data: account } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  // Create a pending payment record first to get the id for metadata
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      professional_id,
      type: 'booking_deposit',
      amount: amount / 100, // convert cents to decimal
      currency: body.currency ?? 'eur',
      status: 'pending',
      client_name,
      client_email,
      client_phone: body.client_phone ?? null,
      service_name,
      appointment_id: body.appointment_id ?? null,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('[checkout] Failed to create payment record', insertError)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kelen.africa'

  try {
    const session = await createCheckoutSession({
      stripeAccountId: account.stripe_account_id,
      serviceName: service_name,
      amount,
      currency: body.currency ?? 'eur',
      clientEmail: client_email,
      successUrl: `${origin}/booking/success?payment_id=${payment.id}`,
      cancelUrl: `${origin}/booking/cancel`,
      metadata: {
        professional_id,
        payment_id: payment.id,
        appointment_id: body.appointment_id ?? '',
      },
    })

    // Save the checkout session id
    await supabase
      .from('payments')
      .update({ stripe_checkout_session: session.id })
      .eq('id', payment.id)

    return NextResponse.json({ checkout_url: session.url, payment_id: payment.id })
  } catch (err) {
    console.error('[checkout] Stripe checkout session creation failed', String(err))
    // Clean up the pending payment record
    await supabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
