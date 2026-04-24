import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteContact } from '@/components/pro-site/ProSiteContact'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings } from '@/lib/pro-site/actions'

export default async function AProposPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, category, phone, whatsapp, email')
    .eq('slug', slug)
    .single()
  if (!pro) notFound()

  const { data: portfolio } = await supabase
    .from('professional_portfolio')
    .select('about_text, about_image_url')
    .eq('professional_id', pro.id)
    .maybeSingle()

  if (!portfolio?.about_text) notFound()

  const settings = await getProSiteSettings(pro.id)
  const proName = pro.business_name ?? pro.owner_name ?? slug

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={null}>
      <ProSiteNav
        slug={pro.slug}
        proName={proName}
        showServices={settings?.showServices ?? true}
        showRealisations={settings?.showRealisations ?? true}
        showProduits={settings?.showProduits ?? true}
        calendarUrl={null}
      />
      <main>
        <div className="bg-[#1a1a2e] px-6 py-8 text-white">
          <Link href={`/professionnels/${pro.slug}`} className="text-xs text-white/50 hover:text-white/80 mb-4 inline-block">
            ← {proName}
          </Link>
          <p className="text-xs uppercase tracking-widest opacity-50 mb-1">{pro.category ?? ''}</p>
          <h1 className="text-3xl font-black">{proName}</h1>
        </div>

        <div className="bg-[var(--pro-surface,#fff)] px-6 py-8">
          {portfolio.about_image_url && (
            <img
              src={portfolio.about_image_url}
              alt={proName}
              className="w-full h-56 object-cover rounded-[var(--pro-radius,16px)] mb-6"
            />
          )}
          <div
            className="prose prose-sm max-w-none text-[var(--pro-text-muted,#444)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: portfolio.about_text }}
          />
        </div>

        <ProSiteContact
          proName={proName}
          phone={pro.phone ?? null}
          whatsapp={pro.whatsapp ?? null}
          email={pro.email ?? null}
          calendarUrl={null}
        />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
