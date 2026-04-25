// components/pro-site/ProSiteDetailPage.tsx
import Link from 'next/link'
import Image from 'next/image'
import { ProSiteGallery } from './ProSiteGallery'
import { ProSiteVideoRow } from './ProSiteVideoRow'
import { ProSiteSocialThread } from './ProSiteSocialThread'
import { ProSiteItemCard } from './ProSiteItemCard'
import type { ItemType, ProSiteComment, ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteDetailPage({
  slug,
  sectionPath,
  sectionTitle,
  proName,
  calendarUrl,
  whatsapp,
  item,
  images,
  videos,
  pills,
  initialComments,
  initialLikeCount,
  relatedItems,
}: {
  slug: string
  sectionPath: string
  sectionTitle: string
  proName: string
  calendarUrl: string | null
  whatsapp: string | null
  item: ProSiteItem & { fullDescription?: string }
  images: string[]
  videos: { url: string; durationSeconds?: number }[]
  pills: string[]
  initialComments: ProSiteComment[]
  initialLikeCount: number
  relatedItems: ProSiteItem[]
}) {
  const itemType = sectionPath.replace(/s$/, '') as ItemType

  return (
    <>
      <div className="bg-white border-b border-[var(--pro-border,#eee)] px-6 py-3 flex items-center gap-2 text-xs">
        <Link href={`/professionnels/${slug}`} className="text-[#009639] hover:underline">← {proName}</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/professionnels/${slug}/${sectionPath}`} className="text-[#009639] hover:underline">{sectionTitle}</Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-[var(--pro-text,#1a1a2e)] line-clamp-1">{item.title}</span>
      </div>

      {item.imageUrl && (
        <div className="relative h-64 w-full">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute top-3 right-3 bg-black/40 rounded-full px-3 py-1 flex items-center gap-1 z-10">
            <span className="text-white text-base">♡</span>
            <span className="text-white text-xs font-bold">{initialLikeCount}</span>
          </div>
        </div>
      )}

      <div className="bg-[var(--pro-surface,#fff)] px-6 py-5 border-b border-[var(--pro-border,#eee)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-black text-[var(--pro-text,#1a1a2e)] leading-tight">{item.title}</h1>
            {item.price && <p className="text-sm font-bold text-[#009639] mt-1">{item.price}</p>}
          </div>
        </div>
        <div className="flex gap-3">
          {calendarUrl && (
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-[#E05555] text-white py-2.5 rounded-[var(--pro-radius,16px)] text-sm font-extrabold text-center hover:opacity-90">
              📅 Prendre RDV
            </a>
          )}
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] text-white py-2.5 rounded-[var(--pro-radius,16px)] text-sm font-bold text-center hover:opacity-90">
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="bg-[var(--pro-surface,#fff)] px-6 py-5 border-b border-[var(--pro-border,#eee)]">
        <h2 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-3">Description</h2>
        <p className="text-sm text-[var(--pro-text-muted,#444)] leading-relaxed">
          {item.fullDescription ?? item.description}
        </p>
        {pills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {pills.map((p, i) => (
              <span key={i} className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600 font-semibold">{p}</span>
            ))}
          </div>
        )}
      </div>

      <ProSiteGallery images={images} />
      <ProSiteVideoRow videos={videos} />

      <ProSiteSocialThread
        itemType={itemType}
        itemId={item.id}
        initialComments={initialComments}
        initialLikeCount={initialLikeCount}
      />

      {relatedItems.length > 0 && (
        <div className="bg-[var(--pro-surface-alt,#f5f5f5)] px-6 py-6">
          <h3 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-4">
            Autres {sectionTitle.toLowerCase()}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {relatedItems.slice(0, 2).map((r) => (
              <ProSiteItemCard
                key={r.id}
                item={r}
                href={`/professionnels/${slug}/${sectionPath}/${r.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
