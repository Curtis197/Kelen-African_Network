import Link from 'next/link'

export function ProSiteNav({
  slug,
  proName,
  showServices,
  showRealisations,
  showProduits,
  calendarUrl,
}: {
  slug: string
  proName: string
  showServices: boolean
  showRealisations: boolean
  showProduits: boolean
  calendarUrl: string | null
}) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--pro-border,#eee)] px-6 py-3 flex items-center justify-between">
      <Link href={`/professionnels/${slug}`} className="font-extrabold text-sm text-[#1a1a2e]">
        {proName}
      </Link>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {showServices && (
          <Link href={`/professionnels/${slug}/services`} className="hover:text-[#1a1a2e]">
            Services
          </Link>
        )}
        {showRealisations && (
          <Link href={`/professionnels/${slug}/realisations`} className="hover:text-[#1a1a2e]">
            Réalisations
          </Link>
        )}
        {showProduits && (
          <Link href={`/professionnels/${slug}/produits`} className="hover:text-[#1a1a2e]">
            Produits
          </Link>
        )}
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#E05555] text-white px-3 py-1.5 text-xs font-bold rounded-[var(--pro-radius,16px)] hover:opacity-90"
          >
            📅 Prendre RDV
          </a>
        )}
        <a
          href={`/professionnels/${slug}#contact`}
          className="bg-[#009639] text-white px-3 py-1.5 text-xs font-bold rounded-[var(--pro-radius,16px)] hover:opacity-90"
        >
          Contact
        </a>
      </div>
    </nav>
  )
}
