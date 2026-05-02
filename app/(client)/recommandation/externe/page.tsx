"use client";

import { RecommendationForm } from "@/components/forms/RecommendationForm";

export default function ExternalRecommendationPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Rich green header banner ───────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-kelen-green-900/20"
        style={{
          background: "linear-gradient(135deg, #052e16 0%, #14532d 45%, #166534 100%)",
        }}
      >
        {/* Diamond texture */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"%3E%3Cpolygon points="16,2 30,16 16,30 2,16" fill="none" stroke="white" stroke-width="1"/%3E%3C/svg%3E\')',
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow orb */}
        <div className="absolute -bottom-10 left-1/3 w-72 h-72 rounded-full bg-kelen-green-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-10">
          <div className="flex items-start gap-5">
            {/* Icon */}
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>

            <div className="flex-1">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-kelen-green-300">
                Recommandation externe
              </p>
              <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
                Recommander un professionnel
              </h1>
              <p className="mt-2 text-sm text-green-100/70 leading-relaxed max-w-xl">
                Ce professionnel n'est pas encore sur Kelen. Votre témoignage l'aide à construire sa réputation documentée.
              </p>
            </div>
          </div>

          {/* Info strip */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "⭐", label: "Témoignage authentique", desc: "Basé sur une expérience réelle" },
              { icon: "📈", label: "Impact immédiat", desc: "Visible dès validation par Kelen" },
              { icon: "🤝", label: "Soutien concret", desc: "Aide le professionnel à se développer" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white/90">{item.label}</p>
                  <p className="text-[11px] text-green-200/60 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pan-African strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          <div className="flex-1 bg-kelen-green-400/80" />
          <div className="flex-1 bg-kelen-yellow-500/60" />
          <div className="flex-1 bg-kelen-red-500/40" />
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-kelen-green-100 bg-white p-8 shadow-lg shadow-kelen-green-900/5">
          {/* Form header */}
          <div className="mb-6 flex items-center gap-3 pb-5 border-b border-stone-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kelen-green-50 text-kelen-green-600">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Formulaire de recommandation</p>
              <p className="text-xs text-muted-foreground">Tous les champs marqués * sont obligatoires</p>
            </div>
          </div>
          <RecommendationForm isExternal={true} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Les recommandations sont vérifiées avant publication. Seuls les témoignages authentiques sont acceptés.
        </p>
      </div>
    </div>
  );
}
