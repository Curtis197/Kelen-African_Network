import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { initPayment } from '@/lib/flutterwave'

export async function POST(request: NextRequest) {
  let body: {
    professional_id: string
    service_name: string
    /** Amount in XOF (FCFA). E.g. 5000 for 5 000 F CFA. */
    amount: number
    /** "XOF" (default) or "XAF" for Cameroon */
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

  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      professional_id,
      type: 'booking_deposit',
      amount,
      currency: (body.currency ?? 'xof').toLowerCase(),
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
    console.error('[flutterwave/checkout] Failed to create payment record', insertError)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kelen.africa'

  try {
    const result = await initPayment({
      transactionRef: payment.id,
      amount,
      currency: body.currency ?? 'XOF',
      description: service_name,
      redirectUrl: `${siteUrl}/paiement/mobile-money/succes`,
      mobileMoneyOnly: true,
      customer: {
        email: client_email,
        name: client_name,
        phone: body.client_phone,
      },
      meta: { professional_id, payment_id: payment.id },
    })

    return NextResponse.json({
      payment_id: payment.id,
      payment_url: result.paymentLink,
    })
  } catch (err: unknown) {
    console.error('[flutterwave/checkout] initPayment error', String(err))
    await supabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Payment service unavailable, please try again' }, { status: 502 })
  }
}
