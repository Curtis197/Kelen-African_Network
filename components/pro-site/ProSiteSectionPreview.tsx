import Link from 'next/link'
import type { ProSiteItem } from '@/lib/pro-site/types'

type Variant = 'services' | 'portfolio' | 'products'

const FALLBACK_IMG = '/images/hero-africa-construction.png'

/* ── Services — 3-col image cards with numbered prefix ─────────────────── */
function ServicesGrid({ items, listHref, base, sectionPath }: { items: ProSiteItem[]; listHref: string; base: string; sectionPath: string }) {
  return (
    <section className="py-[88px] border-t border-stone-200 bg-stone-50" id="services">
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="mb-12">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500 block mb-3">NOS SERVICES</span>
          <h2 className="font-headline font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-[#1A1A1A]">
            Ce que nous proposons.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.slice(0, 3).map((s, i) => (
            <Link key={s.id} href={`${base}/${sectionPath}/${s.id}`} className="no-underline group">
              <article className="bg-white border border-stone-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                <div className="overflow-hidden bg-stone-100" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={s.imageUrl ?? FALLBACK_IMG}
                    alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="font-mono text-xs font-medium text-kelen-green-700 tracking-wide mb-2">0{i + 1}</div>
                  <h3 className="font-headline font-bold text-[20px] tracking-[-0.01em] text-[#1A1A1A] mb-2">{s.title}</h3>
                  {s.description && (
                    <p className="text-[15px] text-stone-500 leading-[1.6] mb-4 line-clamp-3">{s.description}</p>
                  )}
                  {s.price && (
                    <div className="pt-4 border-t border-stone-200 flex flex-col gap-0.5">
                      <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500 font-semibold">À partir de</span>
                      <strong className="font-headline font-bold text-[15px] text-[#1A1A1A]">{s.price}</strong>
                    </div>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
        {items.length > 3 && (
          <div className="mt-10 pt-6 border-t border-stone-200 flex justify-end">
            <Link href={listHref} className="text-sm font-semibold text-kelen-green-700 hover:underline underline-offset-3 no-underline">
              Voir tous les services →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/* ── Portfolio — 3-col grid, 4:3 images, caption below ─────────────────── */
function PortfolioGrid({ items, listHref, base, sectionPath }: { items: ProSiteItem[]; listHref: string; base: string; sectionPath: string }) {
  return (
    <section className="py-[88px] border-t border-stone-200 bg-white" id="portfolio">
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="mb-12 flex justify-between items-end gap-6 flex-wrap">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500 block mb-3">RÉALISATIONS</span>
            <h2 className="font-headline font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-[#1A1A1A]">
              Sélection de projets récents.
            </h2>
          </div>
          <Link href={listHref} className="text-sm font-semibold text-kelen-green-700 hover:underline underline-offset-3 no-underline whitespace-nowrap">
            Voir toutes les réalisations →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.slice(0, 3).map((p) => (
            <Link key={p.id} href={`${base}/${sectionPath}/${p.id}`} className="no-underline group">
              <figure className="flex flex-col gap-3.5">
                <div className="overflow-hidden rounded-lg bg-stone-100" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={p.imageUrl ?? FALLBACK_IMG}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <figcaption>
                  <div className="font-headline font-bold text-[16px] text-[#1A1A1A] tracking-[-0.005em] group-hover:text-kelen-green-700 transition-colors">
                    {p.title}
                  </div>
                  {p.description && (
                    <div className="text-[13px] text-stone-500 mt-0.5 line-clamp-1">{p.description}</div>
                  )}
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Products — horizontal scroll carousel ──────────────────────────────── */
function ProductsCarousel({ items, listHref, base, sectionPath }: { items: ProSiteItem[]; listHref: string; base: string; sectionPath: string }) {
  return (
    <section className="py-[88px] border-t border-stone-200 bg-white" id="produits">
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="mb-12 flex justify-between items-end gap-6 flex-wrap">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500 block mb-3">PRODUITS</span>
            <h2 className="font-headline font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-[#1A1A1A]">
              Ce que nous proposons.
            </h2>
          </div>
          <Link href={listHref} className="text-sm font-semibold text-kelen-green-700 hover:underline underline-offset-3 no-underline whitespace-nowrap">
            Voir tous les produits →
          </Link>
        </div>
        <div
          className="flex gap-5 overflow-x-auto pb-2"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((p) => (
            <Link
              key={p.id}
              href={`${base}/${sectionPath}/${p.id}`}
              className="no-underline group flex-shrink-0"
              style={{ width: '340px', scrollSnapAlign: 'start' }}
            >
              <article className="bg-white border border-stone-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                <div className="overflow-hidden bg-stone-100" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={p.imageUrl ?? FALLBACK_IMG}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-headline font-bold text-[18px] tracking-[-0.01em] text-[#1A1A1A] mb-2">{p.title}</h3>
                  {p.description && (
                    <p className="text-sm text-stone-500 leading-[1.6] mb-3 line-clamp-2">{p.description}</p>
                  )}
                  {p.price && (
                    <div className="font-headline font-bold text-[20px] text-kelen-green-700 tracking-[-0.01em]">
                      {p.price}
                    </div>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Public component ───────────────────────────────────────────────────── */
export function ProSiteSectionPreview({
  variant = 'portfolio',
  title,
  listHref,
  items,
  slug,
  sectionPath,
  basePath,
}: {
  variant?: Variant
  title: string
  listHref: string
  items: ProSiteItem[]
  slug: string
  sectionPath: string
  basePath?: string
}) {
  const base = basePath ?? `/professionnels/${slug}`
  if (items.length === 0) return null

  if (variant === 'services') {
    return <ServicesGrid items={items} listHref={listHref} base={base} sectionPath={sectionPath} />
  }
  if (variant === 'products') {
    return <ProductsCarousel items={items} listHref={listHref} base={base} sectionPath={sectionPath} />
  }
  return <PortfolioGrid items={items} listHref={listHref} base={base} sectionPath={sectionPath} />
}
