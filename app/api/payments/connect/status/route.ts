import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const professionalId = request.nextUrl.searchParams.get('professional_id')
  if (!professionalId) {
    return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })
  }

  // Verify this pro belongs to the authenticated user
  const { data: pro } = await supabase
    .from('professionals')
    .select('id')
    .eq('id', professionalId)
    .eq('user_id', user.id)
    .single()

  if (!pro) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: account } = await supabase
    .from('payment_accounts')
    .select('flw_subaccount_id, onboarded, payment_mode, deposit_type, deposit_amount, deposit_percent, orange_merchant_number')
    .eq('professional_id', professionalId)
    .single()

  if (!account) {
    return NextResponse.json({ onboarded: false, hasAccount: false })
  }

  return NextResponse.json({
    onboarded: account.onboarded,
    hasAccount: true,
    paymentMode: account.payment_mode,
    depositType: account.deposit_type,
    depositAmount: account.deposit_amount,
    depositPercent: account.deposit_percent,
    hasOrangeMoney: !!account.orange_merchant_number,
  })
}
