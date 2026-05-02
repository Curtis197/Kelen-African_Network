import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteDetailPage } from '@/components/pro-site/ProSiteDetailPage'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings, getProSiteRealisations, getItemComments } from '@/lib/pro-site/actions'

export default async function RealisationDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, category, whatsapp')
    .eq('slug', slug)
    .single()
  if (!pro) notFound()

  const { data: real } = await supabase
    .from('project_documents')
    .select('id, title, description, project_images(url, is_main)')
    .eq('id', id)
    .eq('professional_id', pro.id)
    .single()
  if (!real) notFound()

  const [settings, allReals, comments] = await Promise.all([
    getProSiteSettings(pro.id),
    getProSiteRealisations(pro.id),
    getItemComments('realisation', id),
  ])

  const { count: likeCount } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', 'realisation')
    .eq('item_id', id)

  const proName = pro.business_name ?? pro.owner_name ?? slug
  const projectImages = real.project_images as { url: string; is_main: boolean }[] | null
  const mainImage = projectImages?.find((i) => i.is_main)?.url ?? projectImages?.[0]?.url ?? null
  const images = projectImages?.map((i) => i.url) ?? []

  const item = {
    id: real.id,
    title: real.title,
    description: real.description ?? null,
    fullDescription: real.description ?? undefined,
    price: null,
    imageUrl: mainImage,
    likeCount: likeCount ?? 0,
    commentCount: comments.length,
  }
  const relatedItems = allReals.filter((r) => r.id !== id)

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={settings?.logoColor ?? null} imageWeight={settings?.imageWeight} spacing={settings?.spacing}>
      <ProSiteNav slug={pro.slug} proName={proName} showServices={settings?.showServices ?? true} showRealisations={true} showProduits={settings?.showProduits ?? true} calendarUrl={null} />
      <main>
        <ProSiteDetailPage
          slug={pro.slug}
          sectionPath="realisations"
          sectionTitle="Réalisations"
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
