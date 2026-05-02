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
      <div
        className="overflow-hidden transition-all duration-200 hover:shadow-lg"
        style={{
          background: 'var(--pro-surface, #fff)',
          border: '1px solid var(--pro-border, #eee)',
          borderRadius: 'var(--pro-radius, 16px)',
        }}
      >
        {/* Thumbnail */}
        {item.imageUrl ? (
          <div className="relative w-full h-36 overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          </div>
        ) : (
          <div
            className="w-full h-36 flex items-center justify-center"
            style={{ background: 'var(--pro-surface-alt, #f5f5f5)' }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--pro-text-muted, #bbb)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          <p
            className="font-bold text-sm mb-1 line-clamp-1"
            style={{ color: 'var(--pro-text, #1a1a2e)' }}
          >
            {item.title}
          </p>
          {item.description && (
            <p
              className="text-xs mb-2 line-clamp-2 leading-relaxed"
              style={{ color: 'var(--pro-text-muted, #888)' }}
            >
              {item.description}
            </p>
          )}
          {item.price && (
            <p className="text-xs font-bold text-[#009639] mb-2">{item.price}</p>
          )}

          {/* Social row */}
          <div
            className="flex gap-3 items-center pt-2 mt-1"
            style={{ borderTop: '1px solid var(--pro-border, #eee)' }}
          >
            <span
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: 'var(--pro-text-muted, #aaa)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {item.likeCount}
            </span>
            <span
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: 'var(--pro-text-muted, #aaa)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {item.commentCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
