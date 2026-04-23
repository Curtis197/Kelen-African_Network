// app/(pro-preview)/pro/preview/[slug]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteHero } from '@/components/pro-site/ProSiteHero'
import { ProSitePresentation } from '@/components/pro-site/ProSitePresentation'
import { ProSiteQualities } from '@/components/pro-site/ProSiteQualities'
import { ProSiteGoogleReviews } from '@/components/pro-site/ProSiteGoogleReviews'
import { ProSiteSectionPreview } from '@/components/pro-site/ProSiteSectionPreview'
import { ProSiteNewsletter } from '@/components/pro-site/ProSiteNewsletter'
import { ProSiteContact } from '@/components/pro-site/ProSiteContact'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import {
  getProSiteSettings,
  getProSiteServices,
  getProSiteRealisations,
  getProSiteProduits,
} from '@/lib/pro-site/actions'
import type { CornerStyle, ColorMode } from '@/lib/pro-site/types'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ corner_style?: string; color_mode?: string }>
}

export default async function ProPreviewPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams

  const supabase = await createClient()

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/pro/connexion')

  // Fetch the professional
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, description, category, city, years_experience, team_size, verified, phone, whatsapp, email, portfolio_photos')
    .eq('slug', slug)
    .single()

  if (!pro) notFound()

  // Only the owner can preview
  const { data: ownership } = await supabase
    .from('professionals')
    .select('id')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!ownership) redirect('/pro/site')

  const [settings, services, realisations, produits] = await Promise.all([
    getProSiteSettings(pro.id),
    getProSiteServices(pro.id),
    getProSiteRealisations(pro.id),
    getProSiteProduits(pro.id),
  ])

  const { data: portfolio } = await supabase
    .from('professional_portfolio')
    .select('about_text, hero_image_url, hero_subtitle')
    .eq('professional_id', pro.id)
    .maybeSingle()

  const { data: calendarToken } = await supabase
    .from('pro_calendar_tokens')
    .select('id')
    .eq('professional_id', pro.id)
    .maybeSingle()

  // Style: URL params override saved settings (for live preview from SiteBuilder)
  const cornerStyle = (sp.corner_style as CornerStyle | undefined) ?? settings?.cornerStyle ?? 'rounded'
  const colorMode = (sp.color_mode as ColorMode | undefined) ?? settings?.colorMode ?? 'light'

  const proName = pro.business_name ?? pro.owner_name ?? slug
  const profession = pro.category ?? ''
  const basePath = `/pro/preview/${slug}`
  const calendarUrl = calendarToken ? `/professionnels/${slug}/prendre-rdv` : null

  return (
    <ProSiteStyleProvider cornerStyle={cornerStyle} colorMode={colorMode} logoColor={null}>
      {/* Preview banner */}
      <div className="sticky top-0 z-[100] bg-amber-400 text-amber-900 text-center text-xs font-bold py-1.5 px-4">
        MODE APERÇU — Voici ce que vos clients voient
      </div>

      <ProSiteNav
        slug={slug}
        proName={proName}
        role={profession}
        showServices={settings?.showServices ?? true}
        showRealisations={settings?.showRealisations ?? true}
        showProduits={settings?.showProduits ?? true}
        calendarUrl={calendarUrl}
        basePath={basePath}
      />
      <main>
        <ProSiteHero
          coverImageUrl={portfolio?.hero_image_url ?? (pro.portfolio_photos as string[] | null)?.[0] ?? null}
          profession={profession}
          proName={proName}
          tagline={portfolio?.hero_subtitle ?? null}
        />
        <ProSitePresentation
          lead={portfolio?.about_text ?? null}
          bio={pro.description ?? ''}
          city={pro.city ?? null}
          yearsExperience={pro.years_experience ?? null}
          teamSize={pro.team_size ?? null}
        />
        <ProSiteQualities />
        <ProSiteGoogleReviews professionalId={pro.id} />
        {(settings?.showServices ?? true) && (
          <ProSiteSectionPreview
            variant="services"
            title="Services"
            listHref={`${basePath}/services`}
            items={services}
            slug={slug}
            sectionPath="services"
            basePath={basePath}
          />
        )}
        {(settings?.showRealisations ?? true) && (
          <ProSiteSectionPreview
            variant="portfolio"
            title="Réalisations"
            listHref={`${basePath}/realisations`}
            items={realisations}
            slug={slug}
            sectionPath="realisations"
            basePath={basePath}
          />
        )}
        {(settings?.showProduits ?? true) && (
          <ProSiteSectionPreview
            variant="products"
            title="Produits"
            listHref={`${basePath}/produits`}
            items={produits}
            slug={slug}
            sectionPath="produits"
            basePath={basePath}
          />
        )}
        <ProSiteNewsletter professionalId={pro.id} proName={proName} whatsapp={pro.whatsapp ?? null} />
        <ProSiteContact
          proName={proName}
          phone={pro.phone ?? null}
          whatsapp={pro.whatsapp ?? null}
          email={pro.email ?? null}
          calendarUrl={calendarUrl}
        />
      </main>
      <ProSiteFooter proName={proName} phone={pro.phone ?? null} email={pro.email ?? null} slug={slug} />
    </ProSiteStyleProvider>
  )
}
