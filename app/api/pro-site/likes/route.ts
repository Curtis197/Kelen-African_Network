import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('kelen_session')?.value ?? randomUUID()
}

// GET /api/pro-site/likes?item_type=service&item_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const itemType = searchParams.get('item_type')
  const itemId = searchParams.get('item_id')
  if (!itemType || !itemId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()
  const sessionId = await getOrCreateSessionId()

  const [{ count }, { data: myLike }] = await Promise.all([
    supabase
      .from('item_likes')
      .select('*', { count: 'exact', head: true })
      .eq('item_type', itemType)
      .eq('item_id', itemId),
    supabase
      .from('item_likes')
      .select('id')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .eq('session_id', sessionId)
      .maybeSingle(),
  ])

  const res = NextResponse.json({ count: count ?? 0, liked: !!myLike })
  res.cookies.set('kelen_session', sessionId, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  return res
}

// POST /api/pro-site/likes  body: { item_type, item_id }
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('kelen_session')?.value

  // Require an existing session cookie (set by the GET endpoint).
  // This blocks headless clients that omit cookies from inflating likes.
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session requise. Rechargez la page et réessayez.' },
      { status: 400 },
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { item_type, item_id } = body
  if (!item_type || !item_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('item_likes')
    .select('id')
    .eq('item_type', item_type)
    .eq('item_id', item_id)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) {
    await supabase.from('item_likes').delete().eq('id', existing.id)
  } else {
    await supabase.from('item_likes').insert({ item_type, item_id, session_id: sessionId })
  }

  const { count } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', item_type)
    .eq('item_id', item_id)

  const res = NextResponse.json({ count: count ?? 0, liked: !existing })
  res.cookies.set('kelen_session', sessionId, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  return res
}
