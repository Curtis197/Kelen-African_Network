// components/pro-site/ProSiteItemCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { ProSiteItem } from '@/lib/pro-site/types'

export function ProSiteItemCard({
  item,
  href,
}: {
  item: ProSiteItem
  href: string
}) {
  return (
    <Link href={href} className="block group">
      <div className="bg-[var(--pro-surface,#fff)] border border-[var(--pro-border,#eee)] rounded-[var(--pro-radius,16px)] overflow-hidden hover:shadow-md transition-shadow">
        {item.imageUrl ? (
          <div className="relative w-full h-36">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="w-full h-36 bg-gray-100" />
        )}
        <div className="p-3">
          <p className="font-bold text-sm text-[var(--pro-text,#1a1a2e)] mb-1 line-clamp-1">
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-[var(--pro-text-muted,#888)] mb-2 line-clamp-2">
              {item.description}
            </p>
          )}
          {item.price && (
            <p className="text-xs font-bold text-[#009639] mb-2">{item.price}</p>
          )}
          <div className="flex gap-3 items-center border-t border-[var(--pro-border,#eee)] pt-2">
            <span className="text-xs text-[var(--pro-text-muted,#888)]">♡ {item.likeCount}</span>
            <span className="text-xs text-[var(--pro-text-muted,#888)]">💬 {item.commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
