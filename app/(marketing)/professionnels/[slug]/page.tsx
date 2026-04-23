import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProSiteGoogleReviews } from '@/components/pro-site/ProSiteGoogleReviews'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteHero } from '@/components/pro-site/ProSiteHero'
import { ProSitePresentation } from '@/components/pro-site/ProSitePresentation'
import { ProSiteQualities } from '@/components/pro-site/ProSiteQualities'
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

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, description, category, city, country, photo_url, status")
    .eq("slug", slug)
    .single();

  if (!pro) return { title: "Professionnel non trouvé | Kelen" };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';
  const profileUrl = `${baseUrl}/professionnels/${slug}`;

  // Build description with context
  const locationParts = [pro.city, pro.country].filter(Boolean).join(', ');
  const categoryLabel = pro.category ? pro.category.charAt(0).toUpperCase() + pro.category.slice(1) : 'Professionnel';
  const description = pro.description
    || `${categoryLabel} basé${locationParts ? ` à ${locationParts}` : ''}. Consultez son portfolio et ses recommandations vérifiées sur Kelen.`;

  // Free profiles: noindex
  // Paid profiles: full indexing (subscription check when payment is implemented)
  const isPaid = pro.status === 'gold' || pro.status === 'silver';

  return {
    title: `${pro.business_name} — ${categoryLabel}${locationParts ? ` à ${locationParts}` : ''} | Kelen`,
    description,
    robots: {
      index: isPaid,
      follow: true,
    },
    openGraph: {
      title: `${pro.business_name} — ${categoryLabel} sur Kelen`,
      description,
      type: 'profile',
      url: profileUrl,
      siteName: 'Kelen',
      locale: 'fr_FR',
      images: pro.photo_url
        ? [{ url: pro.photo_url, width: 1200, height: 630, alt: pro.business_name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pro.business_name} — ${categoryLabel} sur Kelen`,
      description,
      images: pro.photo_url ? [pro.photo_url] : [],
    },
    alternates: {
      canonical: profileUrl,
    },
  };
}

export default async function ProfessionalProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, description, category, city, years_experience, team_size, verified, phone, whatsapp, email, portfolio_photos')
    .eq('slug', slug)
    .single()

  if (!pro) notFound()

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

  // Check if pro has Google Calendar connected
  const { data: calendarToken } = await supabase
    .from('pro_calendar_tokens')
    .select('id')
    .eq('professional_id', pro.id)
    .maybeSingle()

  const cornerStyle = settings?.cornerStyle ?? 'rounded'
  const colorMode = settings?.colorMode ?? 'light'
  const proName = pro.business_name ?? pro.owner_name ?? slug
  const profession = pro.category ?? ''
  // If calendar is connected, link to the booking sub-page (to be created later)
  const calendarUrl = calendarToken ? `/professionnels/${slug}/prendre-rdv` : null

  return (
    <ProSiteStyleProvider cornerStyle={cornerStyle} colorMode={colorMode} logoColor={null}>
      <ProSiteNav
        slug={slug}
        proName={proName}
        role={profession}
        showServices={settings?.showServices ?? true}
        showRealisations={settings?.showRealisations ?? true}
        showProduits={settings?.showProduits ?? true}
        calendarUrl={calendarUrl}
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
            listHref={`/professionnels/${slug}/services`}
            items={services}
            slug={slug}
            sectionPath="services"
          />
        )}
        {(settings?.showRealisations ?? true) && (
          <ProSiteSectionPreview
            variant="portfolio"
            title="Réalisations"
            listHref={`/professionnels/${slug}/realisations`}
            items={realisations}
            slug={slug}
            sectionPath="realisations"
          />
        )}
        {(settings?.showProduits ?? true) && (
          <ProSiteSectionPreview
            variant="products"
            title="Produits"
            listHref={`/professionnels/${slug}/produits`}
            items={produits}
            slug={slug}
            sectionPath="produits"
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
