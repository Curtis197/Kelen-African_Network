import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Flutterwave does not have a hosted dashboard like Stripe Express.
// This route returns the pro's payment settings summary so the UI can
// show their account details and link to a custom payments page.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { professional_id } = await request.json()
  if (!professional_id) {
    return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })
  }

  // Verify this pro belongs to the authenticated user
  const { data: pro } = await supabase
    .from('professionals')
    .select('id')
    .eq('id', professional_id)
    .eq('user_id', user.id)
    .single()

  if (!pro) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: account } = await supabase
    .from('payment_accounts')
    .select('flw_subaccount_id, onboarded, payment_mode')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  // Return internal dashboard URL (payments management page)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kelen.africa'
  return NextResponse.json({
    url: `${siteUrl}/pro/paiements`,
    subaccount_id: account.flw_subaccount_id,
  })
}
