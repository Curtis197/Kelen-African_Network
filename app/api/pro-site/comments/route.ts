import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/pro-site/comments?item_type=service&item_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const itemType = searchParams.get('item_type')
  const itemId = searchParams.get('item_id')
  if (!itemType || !itemId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('item_comments')
    .select('id, author_name, body, created_at, likes:comment_likes(id)')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })

  return NextResponse.json(
    data?.map((r) => ({
      id: r.id,
      authorName: r.author_name,
      body: r.body,
      createdAt: r.created_at,
      likeCount: (r.likes as { id: string }[])?.length ?? 0,
    })) ?? [],
  )
}

const VALID_TYPES = new Set(['service', 'realisation', 'produit'])

// POST /api/pro-site/comments  body: { item_type, item_id, author_name, body }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { item_type, item_id, author_name, body: commentBody } = body

  if (!VALID_TYPES.has(item_type)) return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 })
  if (typeof item_id !== 'string' || item_id.length !== 36) return NextResponse.json({ error: 'Invalid item_id' }, { status: 400 })
  if (typeof author_name !== 'string' || author_name.length < 1 || author_name.length > 80)
    return NextResponse.json({ error: 'author_name must be 1-80 chars' }, { status: 400 })
  if (typeof commentBody !== 'string' || commentBody.length < 1 || commentBody.length > 1000)
    return NextResponse.json({ error: 'body must be 1-1000 chars' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('item_comments')
    .insert({ item_type, item_id, author_name, body: commentBody })
    .select('id, author_name, body, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    id: data.id,
    authorName: data.author_name,
    body: data.body,
    createdAt: data.created_at,
    likeCount: 0,
  })
}
