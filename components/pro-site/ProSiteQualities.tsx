const QUALITIES = [
  {
    icon: '⚡',
    title: 'Rapidité',
    desc: "Réponse sous 2h en journée. Devis sous 48h. Pas d'attente inutile.",
  },
  {
    icon: '💬',
    title: 'Réactivité',
    desc: 'Disponible par WhatsApp, email et téléphone. Communication claire et régulière.',
  },
  {
    icon: '📅',
    title: 'Disponibilité',
    desc: 'Rendez-vous flexibles. Présence sur site selon vos besoins.',
  },
]

export function ProSiteQualities() {
  return (
    <section className="py-[88px] border-t border-stone-200" id="presentation">
      <div className="max-w-[1160px] mx-auto px-8">
        <div className="mb-12">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500 block mb-3">
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
              className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="text-5xl leading-none mb-4">{q.icon}</div>
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
