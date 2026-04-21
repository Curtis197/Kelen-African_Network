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
}: {
  slug: string
  sectionPath: string
  sectionTitle: string
  proName: string
  profession: string
  items: ProSiteItem[]
}) {
  return (
    <>
      <div className="bg-white border-b border-[var(--pro-border,#eee)] px-6 py-3 flex items-center gap-2 text-xs">
        <Link href={`/professionnels/${slug}`} className="text-[#009639] hover:underline">
          ← {proName}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-[var(--pro-text,#1a1a2e)]">{sectionTitle}</span>
      </div>

      <div className="bg-[#1a1a2e] px-6 py-6 text-white">
        <p className="text-xs opacity-50 mb-1">{proName} · {profession}</p>
        <h1 className="text-2xl font-black">{sectionTitle}</h1>
        <p className="text-xs opacity-40 mt-1">{items.length} disponible{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-6 py-6 bg-[var(--pro-surface-alt,#f5f5f5)] min-h-screen">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">Aucun élément pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <ProSiteItemCard
                key={item.id}
                item={item}
                href={`/professionnels/${slug}/${sectionPath}/${item.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
