import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSubaccount } from '@/lib/flutterwave'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    professional_id: string
    bank_code: string
    account_number: string
    country?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { professional_id, bank_code, account_number } = body
  if (!professional_id || !bank_code || !account_number) {
    return NextResponse.json(
      { error: 'Missing required fields: professional_id, bank_code, account_number' },
      { status: 400 }
    )
  }

  // Verify this pro belongs to the authenticated user
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, email, business_name')
    .eq('id', professional_id)
    .eq('user_id', user.id)
    .single()

  if (!pro) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

  // Check if account already exists
  const { data: existing } = await supabase
    .from('payment_accounts')
    .select('flw_subaccount_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  if (existing?.onboarded) {
    return NextResponse.json({ onboarded: true, message: 'Already activated' })
  }

  try {
    const subaccount = await createSubaccount({
      businessName: pro.business_name,
      email: pro.email,
      bankCode: bank_code,
      accountNumber: account_number,
      country: body.country,
    })

    if (existing) {
      await supabase
        .from('payment_accounts')
        .update({ flw_subaccount_id: subaccount.subaccount_id, onboarded: true })
        .eq('professional_id', professional_id)
    } else {
      await supabase.from('payment_accounts').insert({
        professional_id,
        flw_subaccount_id: subaccount.subaccount_id,
        onboarded: true,
      })
    }

    await supabase
      .from('professionals')
      .update({ payments_onboarded: true })
      .eq('id', professional_id)

    return NextResponse.json({ onboarded: true, subaccount_id: subaccount.subaccount_id })
  } catch (err) {
    console.error('[payments/connect/onboard] Flutterwave subaccount creation failed', String(err))
    return NextResponse.json({ error: 'Failed to create payment account' }, { status: 500 })
  }
}
