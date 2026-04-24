const QUALITIES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Rapidité',
    desc: "Réponse sous 2h en journée. Devis sous 48h. Pas d'attente inutile.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Réactivité',
    desc: 'Disponible par WhatsApp, email et téléphone. Communication claire et régulière.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Disponibilité',
    desc: 'Rendez-vous flexibles. Présence sur site selon vos besoins.',
  },
]

export function ProSiteQualities() {
  return (
    <section className="py-[88px] border-t border-stone-100" id="presentation">
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="mb-12">
          <span className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500 mb-3">
            <span className="w-4 h-0.5 bg-kelen-green-600 rounded-full" />
            PRÉSENTATION
          </span>
          <h2 className="font-headline font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-[#1A1A1A]">
            Une collaboration basée sur la confiance.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {QUALITIES.map((q) => (
            <article
              key={q.title}
              className="bg-white border border-stone-100 rounded-xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]"
            >
              <div className="w-12 h-12 rounded-xl bg-kelen-green-50 text-kelen-green-700 flex items-center justify-center mx-auto mb-5">
                {q.icon}
              </div>
              <h3 className="font-headline font-bold text-[20px] text-[#1A1A1A] tracking-[-0.01em] mb-3">
                {q.title}
              </h3>
              <p className="text-[15px] text-stone-500 leading-[1.6]">{q.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
