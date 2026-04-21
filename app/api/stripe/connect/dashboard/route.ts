import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExpressDashboardLink } from '@/lib/stripe-connect'

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
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarded')
    .eq('professional_id', professional_id)
    .single()

  if (!account?.onboarded) {
    return NextResponse.json({ error: 'Pro has not activated payments' }, { status: 402 })
  }

  const link = await createExpressDashboardLink(account.stripe_account_id)
  return NextResponse.json({ url: link.url })
}
