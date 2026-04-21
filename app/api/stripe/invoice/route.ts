import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { createPaymentLink } from '@/lib/stripe-connect'
import { notifyInvoiceSent } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    professional_id: string
    service_name: string
    amount: number
    currency?: string
    client_name: string
    client_email: string
    client_phone?: string
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

  const { data: account } = await serviceSupabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  // Create payment record
  const { data: payment, error: insertError } = await serviceSupabase
    .from('payments')
    .insert({
      professional_id,
      type: 'invoice',
      amount: amount / 100,
      currency: body.currency ?? 'eur',
      status: 'pending',
      client_name,
      client_email,
      client_phone: body.client_phone ?? null,
      service_name,
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  try {
    const link = await createPaymentLink({
      stripeAccountId: account.stripe_account_id,
      serviceName: service_name,
      amount,
      currency: body.currency ?? 'eur',
      metadata: { professional_id, payment_id: payment.id },
    })

    await serviceSupabase
      .from('payments')
      .update({ payment_link_url: link.url })
      .eq('id', payment.id)

    // Fetch pro name for WhatsApp message
    const { data: pro } = await serviceSupabase
      .from('professionals')
      .select('business_name')
      .eq('id', professional_id)
      .single()

    // Auto-send WhatsApp invoice notification if client phone provided
    if (body.client_phone) {
      notifyInvoiceSent({
        professionalId: professional_id,
        paymentId: payment.id,
        clientName: client_name,
        clientPhone: body.client_phone,
        proName: pro?.business_name ?? '',
        amount: `${(amount / 100).toFixed(2)} ${(body.currency ?? 'eur').toUpperCase()}`,
        paymentLink: link.url,
      }).catch((err) => console.error('[invoice] WhatsApp notify failed', String(err)))
    }

    return NextResponse.json({ payment_link: link.url, payment_id: payment.id })
  } catch (err) {
    console.error('[invoice] Stripe payment link creation failed', String(err))
    await serviceSupabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
