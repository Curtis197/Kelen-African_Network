export function ProSitePresentation({
  lead,
  bio,
  city,
  yearsExperience,
  teamSize,
  languages,
  certifications,
}: {
  lead?: string | null
  bio: string
  city: string | null
  yearsExperience: number | null
  teamSize: number | null
  languages?: string | null
  certifications?: string | null
}) {
  const meta = [
    certifications || city
      ? { label: certifications ? 'Formation' : 'Ville', value: certifications ?? city }
      : null,
    languages
      ? { label: 'Langues', value: languages }
      : yearsExperience
      ? { label: 'Expérience', value: `${yearsExperience} ans` }
      : null,
    teamSize
      ? { label: 'Équipe', value: `${teamSize} personne${teamSize > 1 ? 's' : ''}` }
      : city && certifications
      ? { label: 'Ville', value: city }
      : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <section className="py-[88px] border-t border-stone-200" id="about">
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="grid gap-16" style={{ gridTemplateColumns: '200px minmax(0,1fr)' }}>
          {/* Eyebrow col */}
          <div className="pt-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500">
              À PROPOS
            </span>
          </div>

          {/* Content col */}
          <div>
            {lead && (
              <p className="font-headline font-medium text-[26px] leading-[1.35] tracking-[-0.015em] text-[#1A1A1A] mb-5 max-w-[32ch]">
                {lead}
              </p>
            )}
            <p className="text-base text-stone-500 leading-[1.7] mb-8 max-w-[60ch]">{bio}</p>

            {meta.length > 0 && (
              <div
                className="grid gap-6 pt-6 border-t border-stone-200"
                style={{ gridTemplateColumns: `repeat(${Math.min(meta.length, 3)}, minmax(0,1fr))` }}
              >
                {meta.map((m) => (
                  <div key={m.label} className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">
                      {m.label}
                    </span>
                    <span className="text-[15px] text-[#1A1A1A] font-medium leading-snug">{m.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
