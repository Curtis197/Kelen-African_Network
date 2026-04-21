import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnectAccountStatus } from '@/lib/stripe-connect'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const professionalId = request.nextUrl.searchParams.get('professional_id')
  if (!professionalId) {
    return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })
  }

  const { data: account } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded, payment_mode, deposit_type, deposit_amount, deposit_percent')
    .eq('professional_id', professionalId)
    .single()

  if (!account) {
    return NextResponse.json({ onboarded: false, hasAccount: false })
  }

  // If already marked onboarded in DB, trust it — avoid unnecessary Stripe calls
  if (account.onboarded) {
    return NextResponse.json({
      onboarded: true,
      hasAccount: true,
      paymentMode: account.payment_mode,
      depositType: account.deposit_type,
      depositAmount: account.deposit_amount,
      depositPercent: account.deposit_percent,
    })
  }

  // Otherwise verify with Stripe
  const status = await getConnectAccountStatus(account.stripe_account_id)
  return NextResponse.json({
    onboarded: status.onboarded,
    hasAccount: true,
    chargesEnabled: status.chargesEnabled,
    payoutsEnabled: status.payoutsEnabled,
  })
}
