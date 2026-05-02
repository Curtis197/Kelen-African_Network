import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProSiteStyleProvider } from '@/components/pro-site/ProSiteStyleProvider'
import { ProSiteNav } from '@/components/pro-site/ProSiteNav'
import { ProSiteDetailPage } from '@/components/pro-site/ProSiteDetailPage'
import { ProSiteFooter } from '@/components/pro-site/ProSiteFooter'
import { getProSiteSettings, getProSiteProduits, getItemComments } from '@/lib/pro-site/actions'

export default async function ProduitDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: pro } = await supabase
    .from('professionals')
    .select('id, business_name, owner_name, slug, category, whatsapp')
    .eq('slug', slug)
    .single()
  if (!pro) notFound()

  const { data: produit } = await supabase
    .from('professional_products')
    .select('id, title, description, price, product_images(url)')
    .eq('id', id)
    .eq('professional_id', pro.id)
    .single()
  if (!produit) notFound()

  const [settings, allProduits, comments] = await Promise.all([
    getProSiteSettings(pro.id),
    getProSiteProduits(pro.id),
    getItemComments('produit', id),
  ])

  const { count: likeCount } = await supabase
    .from('item_likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', 'produit')
    .eq('item_id', id)

  const proName = pro.business_name ?? pro.owner_name ?? slug
  const images = (produit.product_images as { url: string }[] | null)?.map((i) => i.url) ?? []
  const item = {
    id: produit.id,
    title: produit.title,
    description: produit.description ?? null,
    fullDescription: produit.description ?? undefined,
    price: produit.price ? `${Number(produit.price).toLocaleString('fr-FR')} FCFA` : null,
    imageUrl: images[0] ?? null,
    likeCount: likeCount ?? 0,
    commentCount: comments.length,
  }
  const relatedItems = allProduits.filter((p) => p.id !== id)

  return (
    <ProSiteStyleProvider cornerStyle={settings?.cornerStyle ?? 'rounded'} colorMode={settings?.colorMode ?? 'light'} logoColor={settings?.logoColor ?? null} imageWeight={settings?.imageWeight} spacing={settings?.spacing}>
      <ProSiteNav slug={pro.slug} proName={proName} showServices={settings?.showServices ?? true} showRealisations={settings?.showRealisations ?? true} showProduits={true} calendarUrl={null} />
      <main>
        <ProSiteDetailPage
          slug={pro.slug}
          sectionPath="produits"
          sectionTitle="Produits"
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
