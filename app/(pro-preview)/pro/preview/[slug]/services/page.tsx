// app/(pro-preview)/pro/preview/[slug]/services/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteListPage } from '@/components/pro-site/ProSiteListPage'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings, getProSiteServices } from '@/lib/pro-site/actions'
import type { CornerStyle, ColorMode, ImageWeight, Spacing } from '@/lib/pro-site/types'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ corner_style?: string; color_mode?: string; image_weight?: string; spacing?: string }>
}

export default async function PreviewServicesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/pro/connexion')

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, category')
    .eq('slug', slug)
    .single()
  if (!pro) notFound()

  const { data: ownership } = await supabase
    .from('professionals').select('id').eq('slug', slug).eq('user_id', user.id).maybeSingle()
  if (!ownership) redirect('/pro/site')

  const [settings, items] = await Promise.all([getProSiteSettings(pro.id), getProSiteServices(pro.id)])
  const proName = pro.business_name ?? pro.owner_name ?? slug
  const basePath = `/pro/preview/${slug}`
  const cornerStyle = (sp.corner_style as CornerStyle | undefined) ?? settings?.cornerStyle ?? 'rounded'
  const colorMode = (sp.color_mode as ColorMode | undefined) ?? settings?.colorMode ?? 'light'
  const imageWeight = (sp.image_weight as ImageWeight | undefined) ?? settings?.imageWeight ?? 'balanced'
  const spacing = (sp.spacing as Spacing | undefined) ?? settings?.spacing ?? 'standard'

  return (
    <ProSiteStyleProvider cornerStyle={cornerStyle} colorMode={colorMode} logoColor={settings?.logoColor ?? null} imageWeight={imageWeight} spacing={spacing}>
      <div className="sticky top-0 z-[100] bg-amber-400 text-amber-900 text-center text-xs font-bold py-1.5">
        MODE APERÇU
      </div>
      <ProSiteNav slug={slug} proName={proName} showServices showRealisations={settings?.showRealisations ?? true} showProduits={settings?.showProduits ?? true} calendarUrl={null} basePath={basePath} />
      <main>
        <ProSiteListPage slug={slug} sectionPath="services" sectionTitle="Services" proName={proName} profession={pro.category ?? ''} items={items} basePath={basePath} />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
