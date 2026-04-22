// components/pro-site/ProSitePresentation.tsx
import Link from 'next/link'

export function ProSitePresentation({
  slug,
  bio,
  city,
  yearsExperience,
  teamSize,
  isVerified,
  hasAPropos,
  basePath,
}: {
  slug: string
  bio: string
  city: string | null
  yearsExperience: number | null
  teamSize: number | null
  isVerified: boolean
  hasAPropos: boolean
  basePath?: string
}) {
  const base = basePath ?? `/professionnels/${slug}`
  return (
    <section className="bg-[var(--pro-surface,#fff)] px-6 py-6 border-b border-[var(--pro-border,#eee)]">
      <p className="text-sm leading-relaxed text-[var(--pro-text-muted,#444)] mb-4">{bio}</p>
      <div className="flex flex-wrap gap-2">
        {city && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600">
            📍 {city}
          </span>
        )}
        {yearsExperience && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600">
            ⏱ {yearsExperience} ans d&apos;expérience
          </span>
        )}
        {teamSize && (
          <span className="bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-600">
            👥 {teamSize} employé{teamSize > 1 ? 's' : ''}
          </span>
        )}
        {isVerified && (
          <span className="bg-green-100 rounded-full px-3 py-1 text-xs font-bold text-green-800">
            ✓ Vérifié Kelen
          </span>
        )}
      </div>
      {hasAPropos && (
        <Link
          href={`${base}/a-propos`}
          className="inline-block mt-4 text-xs font-semibold text-[#009639] hover:underline"
        >
          En savoir plus →
        </Link>
      )}
    </section>
  )
}
