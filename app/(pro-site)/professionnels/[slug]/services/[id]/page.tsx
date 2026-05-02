import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteDetailPage } from '@/components/pro-site/ProSiteDetailPage'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings, getProSiteServices, getItemComments } from '@/lib/pro-site/actions'

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, category, whatsapp')
    .eq('slug', slug)
    .single()
  if (!pro) notFound()

  const { data: service } = await supabase
    .from('professional_services')
    .select('id, title, description, price, service_images(url)')
    .eq('id', id)
    .eq('professional_id', pro.id)
    .single()
  if (!service) notFound()

  const [settings, allServices, comments] = await Promise.all([
    getProSiteSettings(pro.id),
    getProSiteServices(pro.id),
    getItemComments('service', id),
  ])

  const { count: likeCount } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', 'service')
    .eq('item_id', id)

  const proName = pro.business_name ?? pro.owner_name ?? slug
  const images = (service.service_images as { url: string }[] | null)?.map((i) => i.url) ?? []
  const item = {
    id: service.id,
    title: service.title,
    description: service.description ?? null,
    fullDescription: service.description ?? undefined,
    price: service.price ? `${Number(service.price).toLocaleString('fr-FR')} FCFA` : 'Sur devis',
    imageUrl: images[0] ?? null,
    likeCount: likeCount ?? 0,
    commentCount: comments.length,
  }
  const relatedItems = allServices.filter((s) => s.id !== id)

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={settings?.logoColor ?? null} imageWeight={settings?.imageWeight} spacing={settings?.spacing}>
      <ProSiteNav slug={pro.slug} proName={proName} showServices={true} showRealisations={settings?.showRealisations ?? true} showProduits={settings?.showProduits ?? true} calendarUrl={null} />
      <main>
        <ProSiteDetailPage
          slug={pro.slug}
          sectionPath="services"
          sectionTitle="Services"
          proName={proName}
          calendarUrl={null}
          whatsapp={pro.whatsapp ?? null}
          item={item}
          images={images}
          videos={[]}
          pills={[]}
          initialComments={comments}
          initialLikeCount={likeCount ?? 0}
          relatedItems={relatedItems}
        />
      </main>
      <ProSiteFooter proName={proName} />
    </ProSiteStyleProvider>
  )
}
