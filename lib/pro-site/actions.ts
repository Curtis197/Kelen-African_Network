// lib/pro-site/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProSiteItem, ProSiteSettings, ProSiteComment } from './types'

export async function getProSiteSettings(professionalId: string): Promise<ProSiteSettings | null> {
  const supabase = await createClient()
  const [{ data }, { data: pro }] = await Promise.all([
    supabase
      .from('professional_portfolio')
      .select('corner_style, color_mode, image_weight, spacing, show_services_section, show_realizations_section, show_products_section, show_calendar_section')
      .eq('professional_id', professionalId)
      .single(),
    supabase
      .from('professionals')
      .select('brand_primary')
      .eq('id', professionalId)
      .single(),
  ])
  if (!data) return null
  return {
    cornerStyle: (data.corner_style as ProSiteSettings['cornerStyle']) ?? 'rounded',
    colorMode: (data.color_mode as ProSiteSettings['colorMode']) ?? 'light',
    logoColor: pro?.brand_primary ?? null,
    imageWeight: (data.image_weight as ProSiteSettings['imageWeight']) ?? 'balanced',
    spacing: (data.spacing as ProSiteSettings['spacing']) ?? 'standard',
    showServices: data.show_services_section ?? true,
    showRealisations: data.show_realizations_section ?? true,
    showProduits: data.show_products_section ?? true,
    showCalendar: data.show_calendar_section ?? false,
  }
}

async function getEngagementCounts(
  itemType: 'service' | 'realisation' | 'produit',
  itemIds: string[],
): Promise<Map<string, { likes: number; comments: number }>> {
  if (itemIds.length === 0) return new Map()
  const supabase = await createClient()
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase
      .from('item_likes')
      .select('item_id')
      .eq('item_type', itemType)
      .in('item_id', itemIds),
    supabase
      .from('item_comments')
      .select('item_id')
      .eq('item_type', itemType)
      .in('item_id', itemIds),
  ])
  const map = new Map<string, { likes: number; comments: number }>()
  itemIds.forEach((id) => map.set(id, { likes: 0, comments: 0 }))
  likes?.forEach(({ item_id }: { item_id: string }) => {
    const e = map.get(item_id)
    if (e) e.likes++
  })
  comments?.forEach(({ item_id }: { item_id: string }) => {
    const e = map.get(item_id)
    if (e) e.comments++
  })
  return map
}

export async function getProSiteServices(professionalId: string): Promise<ProSiteItem[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('professional_services')
    .select('id, title, description, price, service_images(url)')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
  if (!rows?.length) return []
  const counts = await getEngagementCounts('service', rows.map((r) => r.id))
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    price: r.price ? `${Number(r.price).toLocaleString('fr-FR')} FCFA` : 'Sur devis',
    imageUrl: (r.service_images as { url: string }[])?.[0]?.url ?? null,
    likeCount: counts.get(r.id)?.likes ?? 0,
    commentCount: counts.get(r.id)?.comments ?? 0,
  }))
}

export async function getProSiteRealisations(professionalId: string): Promise<ProSiteItem[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('project_documents')
    .select('id, title, description, project_images(url, is_main)')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
  if (!rows?.length) return []
  const counts = await getEngagementCounts('realisation', rows.map((r) => r.id))
  return rows.map((r) => {
    const images = r.project_images as { url: string; is_main: boolean }[] | null
    const mainImage = images?.find((i) => i.is_main)?.url ?? images?.[0]?.url ?? null
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? null,
      price: null,
      imageUrl: mainImage,
      likeCount: counts.get(r.id)?.likes ?? 0,
      commentCount: counts.get(r.id)?.comments ?? 0,
    }
  })
}

export async function getProSiteProduits(professionalId: string): Promise<ProSiteItem[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('professional_products')
    .select('id, title, description, price, product_images(url)')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
  if (!rows?.length) return []
  const counts = await getEngagementCounts('produit', rows.map((r) => r.id))
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    price: r.price ? `${Number(r.price).toLocaleString('fr-FR')} FCFA` : null,
    imageUrl: (r.product_images as { url: string }[])?.[0]?.url ?? null,
    likeCount: counts.get(r.id)?.likes ?? 0,
    commentCount: counts.get(r.id)?.comments ?? 0,
  }))
}

export async function getItemComments(
  itemType: 'service' | 'realisation' | 'produit',
  itemId: string,
): Promise<ProSiteComment[]> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('item_comments')
    .select('id, author_name, body, created_at, likes:comment_likes(id)')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })
  if (!rows) return []
  return rows.map((r) => ({
    id: r.id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
    likeCount: (r.likes as { id: string }[])?.length ?? 0,
  }))
}
