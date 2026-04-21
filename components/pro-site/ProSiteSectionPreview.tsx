// components/pro-site/ProSiteSectionPreview.tsx
import Link from 'next/link'
import { ProSiteItemCard } from './ProSiteItemCard'
import type { ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteSectionPreview({
  title,
  listHref,
  items,
  slug,
  sectionPath,
}: {
  title: string
  listHref: string
  items: ProSiteItem[]
  slug: string
  sectionPath: string
}) {
  if (items.length === 0) return null

  return (
    <section className="bg-[var(--pro-surface-alt,#f5f5f5)] px-6 py-6 border-b border-[var(--pro-border,#eee)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-extrabold text-base text-[var(--pro-text,#1a1a2e)]">{title}</h2>
        <Link href={listHref} className="text-xs font-semibold text-[#009639] hover:underline">
          Voir tout →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.slice(0, 3).map((item) => (
          <ProSiteItemCard
            key={item.id}
            item={item}
            href={`/professionnels/${slug}/${sectionPath}/${item.id}`}
          />
        ))}
      </div>
    </section>
  )
}
