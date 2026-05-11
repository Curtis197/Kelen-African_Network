import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { initPayment } from '@/lib/orange-money'

export async function POST(request: NextRequest) {
  let body: {
    professional_id: string
    service_name: string
    /** Amount in XOF (FCFA), e.g. 5000 for 5 000 F CFA. Minimum: 100. */
    amount: number
    client_name: string
    client_email: string
    client_phone?: string
    /** ISO 3166-1 alpha-2 country of the customer, e.g. "CI", "SN" */
    client_country?: string
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
      currency: 'xof',
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
    console.error('[cinetpay/checkout] Failed to create payment record', insertError)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kelen.africa'
  const nameParts = client_name.trim().split(' ')
  const surname = nameParts[0]
  const name = nameParts.slice(1).join(' ') || surname

  try {
    const result = await initPayment({
      transactionId: payment.id,
      amount,
      description: service_name,
      returnUrl: `${siteUrl}/paiement/mobile-money/succes?payment_id=${payment.id}`,
      notifyUrl: `${siteUrl}/api/orange-money/webhook`,
      channels: 'MOBILE_MONEY',
      customer: {
        name,
        surname,
        email: client_email,
        phone: body.client_phone,
        country: body.client_country ?? 'CI',
      },
    })

    return NextResponse.json({
      payment_id: payment.id,
      payment_url: result.paymentUrl,
    })
  } catch (err: unknown) {
    console.error('[cinetpay/checkout] initPayment error', String(err))
    await supabase.from('payments').delete().eq('id', payment.id)
    return NextResponse.json({ error: 'Payment service unavailable, please try again' }, { status: 502 })
  }
}
