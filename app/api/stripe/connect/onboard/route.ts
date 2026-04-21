import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe-connect'

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
    .select('id, email')
    .eq('id', professional_id)
    .eq('user_id', user.id)
    .single()

  if (!pro) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

  // Check if account already exists
  const { data: existing } = await supabase
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  let stripeAccountId: string

  if (existing) {
    stripeAccountId = existing.stripe_account_id
  } else {
    try {
      const account = await createConnectAccount(pro.email, professional_id)
      stripeAccountId = account.id
      await supabase.from('stripe_connect_accounts').insert({
        professional_id,
        stripe_account_id: stripeAccountId,
        onboarded: false,
      })
    } catch (err) {
      console.error('[connect/onboard] Stripe account creation failed', String(err))
      return NextResponse.json({ error: 'Failed to create Stripe account' }, { status: 500 })
    }
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!
  try {
    const link = await createOnboardingLink(
      stripeAccountId,
      `${origin}/dashboard/payments?onboarded=true`,
      `${origin}/dashboard/payments?refresh=true`
    )
    return NextResponse.json({ onboarding_url: link.url, stripe_account_id: stripeAccountId })
  } catch (err) {
    console.error('[connect/onboard] Failed to create onboarding link', String(err))
    return NextResponse.json({ error: 'Failed to create onboarding link' }, { status: 500 })
  }
}
