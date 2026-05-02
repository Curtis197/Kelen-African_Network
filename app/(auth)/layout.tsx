import Link from "next/link";

const YEAR = new Date().getFullYear();

function GeometricPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="kelen-diamonds"
          x="0"
          y="0"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points="30,4 56,30 30,56 4,30"
            fill="none"
            stroke="rgba(255,255,255,0.045)"
            strokeWidth="1"
          />
          <polygon
            points="30,14 46,30 30,46 14,30"
            fill="none"
            stroke="rgba(255,255,255,0.025)"
            strokeWidth="1"
          />
          <circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.05)" />
          <circle cx="0" cy="0" r="1" fill="rgba(255,255,255,0.04)" />
          <circle cx="60" cy="0" r="1" fill="rgba(255,255,255,0.04)" />
          <circle cx="0" cy="60" r="1" fill="rgba(255,255,255,0.04)" />
          <circle cx="60" cy="60" r="1" fill="rgba(255,255,255,0.04)" />
        </pattern>

        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
        </radialGradient>
      </defs>

      {/* Tiled diamond grid */}
      <rect width="100%" height="100%" fill="url(#kelen-diamonds)" />

      {/* Soft vignette */}
      <rect width="100%" height="100%" fill="url(#vignette)" />

      {/* Large decorative concentric circles — bottom right */}
      <circle cx="115%" cy="92%" r="320" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="115%" cy="92%" r="230" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx="115%" cy="92%" r="150" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

      {/* Top-left accent triangle */}
      <polygon points="0,0 90,0 0,90" fill="rgba(252,207,0,0.05)" />

      {/* Horizontal accent lines — mid left */}
      <line x1="0" y1="55%" x2="44" y2="55%" stroke="rgba(252,207,0,0.35)" strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="calc(55% + 10)" x2="26" y2="calc(55% + 10)" stroke="rgba(252,207,0,0.18)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const trustPoints = [
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: "Vérification documentée",
    desc: "Chaque professionnel validé par son réseau réel",
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Réseau de confiance",
    desc: "Des professionnels recommandés par leurs clients",
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Données sécurisées",
    desc: "Votre identité protégée, vos échanges chiffrés",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (desktop only) ───────────────── */}
      <aside
        className="hidden lg:flex lg:w-[460px] xl:w-[520px] flex-shrink-0 flex-col relative overflow-hidden select-none"
        style={{
          background:
            "linear-gradient(150deg, #002912 0%, #003D1A 35%, #005224 70%, #006B2C 100%)",
        }}
      >
        <GeometricPattern />

        {/* Pan-African tricolor strip at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1.5 z-20">
          <div className="flex-1 bg-kelen-green-500" />
          <div className="flex-1 bg-kelen-yellow-500" />
          <div className="flex-1 bg-kelen-red-500" />
        </div>

        {/* Panel content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14 pb-8">
          {/* Logo */}
          <Link
            href="/"
            className="text-white text-2xl font-black tracking-tight hover:text-white/80 transition-colors w-fit"
          >
            Kelen
          </Link>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Accent lines */}
            <div className="flex items-center gap-2 mb-7">
              <div className="h-px w-10 bg-kelen-yellow-400" />
              <div className="h-px w-5 bg-kelen-yellow-400/35" />
              <div className="h-px w-2 bg-kelen-yellow-400/15" />
            </div>

            <h2
              className="text-white font-black leading-[1.08] tracking-tight"
              style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.65rem)" }}
            >
              La confiance
              <br />
              <span className="text-kelen-yellow-400">ne se promet pas.</span>
            </h2>
            <p className="mt-4 text-white/50 text-base font-light leading-relaxed">
              Elle se documente.
            </p>

            {/* Value propositions */}
            <div className="mt-12 space-y-5">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/75 ring-1 ring-white/10">
                    {point.icon}
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-semibold leading-snug">
                      {point.title}
                    </p>
                    <p className="mt-0.5 text-white/40 text-xs leading-relaxed">
                      {point.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/20 text-xs tracking-wide mt-6">
            © {YEAR} Kelen African Network
          </p>
        </div>
      </aside>

      {/* ── Right auth area ────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-5 py-10 sm:px-8"
        style={{
          background: "#f7f6f5",
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        {/* Mobile logo */}
        <Link
          href="/"
          className="mb-8 text-2xl font-black tracking-tight text-foreground lg:hidden hover:text-kelen-green-600 transition-colors"
        >
          Kelen
        </Link>

        {/* Form card */}
        <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-8 shadow-xl shadow-black/[0.06]">
          {children}
        </div>

        {/* Mobile tagline */}
        <p className="mt-7 text-center text-xs text-muted-foreground lg:hidden max-w-xs">
          La confiance ne se promet pas. Elle se documente.
        </p>
      </main>
    </div>
  );
}
