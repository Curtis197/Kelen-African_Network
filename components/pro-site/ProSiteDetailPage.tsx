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
      {/* ── Breadcrumb ───────────────────────────────────── */}
      <div className="bg-[var(--pro-surface,#fff)] border-b border-[var(--pro-border,#eee)] px-5 py-3 flex items-center gap-1.5 text-[11px] font-medium">
        <Link href={`/professionnels/${slug}`} className="text-[#009639] hover:underline flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {proName}
        </Link>
        <span className="text-[var(--pro-border,#ddd)] select-none">/</span>
        <Link href={`/professionnels/${slug}/${sectionPath}`} className="text-[#009639] hover:underline">{sectionTitle}</Link>
        <span className="text-[var(--pro-border,#ddd)] select-none">/</span>
        <span className="font-bold text-[var(--pro-text,#1a1a2e)] line-clamp-1">{item.title}</span>
      </div>

      {/* ── Hero image ───────────────────────────────────── */}
      {item.imageUrl && (
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Like badge */}
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5 z-10">
            <span className="text-white text-sm leading-none">♡</span>
            <span className="text-white text-xs font-bold">{initialLikeCount}</span>
          </div>
        </div>
      )}

      {/* ── Title + CTA ──────────────────────────────────── */}
      <div
        className="px-5 py-5 border-b border-[var(--pro-border,#eee)]"
        style={{ background: 'var(--pro-surface, #fff)' }}
      >
        <div className="mb-4">
          <h1 className="text-xl font-black leading-tight" style={{ color: 'var(--pro-text, #1a1a2e)' }}>
            {item.title}
          </h1>
          {item.price && (
            <p className="mt-1 text-base font-black text-[#009639]">{item.price}</p>
          )}
        </div>

        {(calendarUrl || whatsapp) && (
          <div className="flex gap-3">
            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--pro-radius,16px)] text-sm font-extrabold text-white bg-[#CE1126] hover:opacity-90 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Prendre RDV
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--pro-radius,16px)] text-sm font-bold text-white bg-[#25D366] hover:opacity-90 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Description ──────────────────────────────────── */}
      <div
        className="px-5 py-5 border-b border-[var(--pro-border,#eee)]"
        style={{ background: 'var(--pro-surface, #fff)' }}
      >
        <h2
          className="text-[11px] font-black uppercase tracking-[0.15em] mb-3"
          style={{ color: 'var(--pro-text-muted, #888)' }}
        >
          Description
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--pro-text-muted, #555)' }}
        >
          {item.fullDescription ?? item.description}
        </p>

        {pills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {pills.map((p, i) => (
              <span
                key={i}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: 'var(--pro-surface-alt, #f0f0f0)',
                  color: 'var(--pro-text, #1a1a2e)',
                  border: '1px solid var(--pro-border, #e0e0e0)',
                }}
              >
                {p}
              </span>
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

      {/* ── Related items ─────────────────────────────────── */}
      {relatedItems.length > 0 && (
        <div
          className="px-5 py-6"
          style={{ background: 'var(--pro-surface-alt, #f5f5f5)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <h3
              className="text-xs font-black uppercase tracking-[0.15em]"
              style={{ color: 'var(--pro-text, #1a1a2e)' }}
            >
              Autres {sectionTitle.toLowerCase()}
            </h3>
            <div className="flex-1 h-px" style={{ background: 'var(--pro-border, #e0e0e0)' }} />
          </div>
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
