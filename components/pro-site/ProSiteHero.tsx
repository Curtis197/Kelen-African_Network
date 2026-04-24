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

      {/* Layered gradient — bottom dark anchor + left-edge vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 0% 100%, rgba(0,0,0,0.35) 0%, transparent 70%)' }} />

      {/* Content anchored to bottom */}
      <div className="absolute inset-0 flex items-end pb-16 sm:pb-20">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-8 w-full">
          <h1
            className="font-headline font-bold text-white leading-[1.08] tracking-[-0.03em] mb-2"
            style={{ fontSize: 'clamp(42px, 5.5vw, 72px)', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
          >
            {proName}
          </h1>
          {profession && (
            <p
              className="text-white/80 font-medium mb-3 tracking-wide uppercase"
              style={{ fontSize: '13px', letterSpacing: '0.1em', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
            >
              {profession}
            </p>
          )}
          {tagline && (
            <p
              className="text-white/80 font-normal mb-8 max-w-[42ch]"
              style={{ fontSize: '20px', lineHeight: 1.55, textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
            >
              {tagline}
            </p>
          )}
          <div className="flex gap-3 flex-wrap">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-b from-kelen-green-600 to-kelen-green-700 hover:from-kelen-green-700 hover:to-kelen-green-800 text-white text-[15px] font-semibold rounded-lg transition-all duration-200 no-underline shadow-[0_4px_16px_rgba(0,97,36,0.4)] active:scale-[0.97]"
            >
              Contact
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white text-[15px] font-semibold rounded-lg transition-all duration-200 no-underline active:scale-[0.97]"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)' }}
            >
              Voir les réalisations →
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50 pointer-events-none">
        <svg className="animate-bounce" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </header>
  )
}
