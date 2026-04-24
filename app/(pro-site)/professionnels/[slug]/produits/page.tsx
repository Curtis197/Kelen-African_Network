import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteListPage } from '@/components/pro-site/ProSiteListPage'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings, getProSiteProduits } from '@/lib/pro-site/actions'

export default async function ProduitsListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, category')
    .eq('slug', slug)
    .single()
  if (!pro) notFound()

  const [settings, items] = await Promise.all([getProSiteSettings(pro.id), getProSiteProduits(pro.id)])
  const proName = pro.business_name ?? pro.owner_name ?? slug

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={null}>
      <ProSiteNav slug={pro.slug} proName={proName} showServices={settings?.showServices ?? true} showRealisations={settings?.showRealisations ?? true} showProduits={true} calendarUrl={null} />
      <main>
        <ProSiteListPage slug={pro.slug} sectionPath="produits" sectionTitle="Produits" proName={proName} profession={pro.category ?? ''} items={items} />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
