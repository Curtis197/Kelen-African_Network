// components/pro-site/ProSiteListPage.tsx
import Link from 'next/link'
import { ProSiteItemCard } from './ProSiteItemCard'
import type { ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteListPage({
  slug,
  sectionPath,
  sectionTitle,
  proName,
  profession,
  items,
  basePath,
}: {
  slug: string
  sectionPath: string
  sectionTitle: string
  proName: string
  profession: string
  items: ProSiteItem[]
  basePath?: string
}) {
  const base = basePath ?? `/professionnels/${slug}`

  return (
    <>
      {/* ── Breadcrumb ───────────────────────────────────── */}
      <div className="bg-[var(--pro-surface,#fff)] border-b border-[var(--pro-border,#eee)] px-5 py-3 flex items-center gap-1.5 text-[11px] font-medium">
        <Link
          href={base}
          className="text-[#009639] hover:underline flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {proName}
        </Link>
        <span className="text-[var(--pro-border,#ddd)] select-none">/</span>
        <span className="font-bold text-[var(--pro-text,#1a1a2e)]">{sectionTitle}</span>
      </div>

      {/* ── Section header ───────────────────────────────── */}
      <div
        className="relative overflow-hidden px-5 py-7"
        style={{ background: 'var(--pro-text, #1a1a2e)' }}
      >
        {/* Subtle dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
            {proName} · {profession}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white leading-tight">{sectionTitle}</h1>
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/70 ring-1 ring-white/10">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/40">
            {items.length === 0
              ? 'Aucun élément disponible'
              : `${items.length} disponible${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────── */}
      <div
        className="px-5 py-6 min-h-[40vh]"
        style={{ background: 'var(--pro-surface-alt, #f5f5f5)' }}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ background: 'var(--pro-surface, #fff)', border: '1px solid var(--pro-border, #eee)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pro-text-muted, #999)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--pro-text, #1a1a2e)' }}>
              Aucun élément pour l&apos;instant
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--pro-text-muted, #888)' }}>
              Revenez bientôt pour découvrir les {sectionTitle.toLowerCase()}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <ProSiteItemCard
                key={item.id}
                item={item}
                href={`${base}/${sectionPath}/${item.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
