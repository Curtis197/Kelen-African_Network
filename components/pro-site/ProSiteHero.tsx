export function ProSiteHero({
  coverImageUrl,
  profession,
  proName,
  tagline,
}: {
  coverImageUrl: string | null
  profession: string
  proName: string
  tagline: string | null
}) {
  return (
    <header
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
      id="top"
    >
      {/* Background */}
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={proName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2c3e6b] to-[#1a1a2e]" />
      )}

      {/* Dark gradient protection */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Content anchored to bottom */}
      <div className="absolute inset-0 flex items-end pb-16">
        <div className="max-w-[1160px] mx-auto px-8 w-full">
          <h1
            className="font-headline font-bold text-white leading-[1.1] tracking-[-0.03em] mb-2"
            style={{ fontSize: 'clamp(42px, 5.5vw, 72px)', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
          >
            {proName}
          </h1>
          {profession && (
            <p
              className="text-white/90 font-medium mb-3"
              style={{ fontSize: '18px', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
            >
              {profession}
            </p>
          )}
          {tagline && (
            <p
              className="text-white/85 font-normal mb-6 max-w-[42ch]"
              style={{ fontSize: '20px', lineHeight: 1.5, textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
            >
              {tagline}
            </p>
          )}
          <div className="flex gap-3 flex-wrap">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-kelen-green-700 hover:bg-kelen-green-800 text-white text-[15px] font-semibold rounded-lg transition-colors no-underline"
            >
              Contact
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white text-[15px] font-semibold rounded-lg transition-colors no-underline"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}
            >
              Voir les réalisations →
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
