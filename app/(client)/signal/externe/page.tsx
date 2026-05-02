"use client";

import { SignalForm } from "@/components/forms/SignalForm";

export default function ExternalSignalPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Rich red header banner ─────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-red-900/20"
        style={{
          background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 45%, #b91c1c 100%)",
        }}
      >
        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 12px)",
          }}
        />
        {/* Glow orb */}
        <div className="absolute -bottom-12 right-1/4 w-80 h-80 rounded-full bg-red-400/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-10">
          <div className="flex items-start gap-5">
            {/* Icon */}
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <div className="flex-1">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-red-300">
                Signalement externe
              </p>
              <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
                Signaler un professionnel
              </h1>
              <p className="mt-2 text-sm text-red-100/70 leading-relaxed max-w-xl">
                Ce professionnel n'est pas encore sur Kelen. Documentez son manquement contractuel pour protéger d'autres clients.
              </p>
            </div>
          </div>

          {/* Info strip */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "🔒", label: "Traitement confidentiel", desc: "Vos coordonnées ne sont jamais publiées" },
              { icon: "📋", label: "Documenté & archivé", desc: "Chaque signalement est conservé" },
              { icon: "🛡️", label: "Protection collective", desc: "Aide la communauté à se protéger" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white/90">{item.label}</p>
                  <p className="text-[11px] text-red-200/60 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pan-African strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          <div className="flex-1 bg-kelen-green-500/60" />
          <div className="flex-1 bg-kelen-yellow-500/60" />
          <div className="flex-1 bg-red-400/80" />
        </div>
      </div>

      {/* ── Form card ─────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-lg shadow-red-900/5">
          {/* Form header */}
          <div className="mb-6 flex items-center gap-3 pb-5 border-b border-stone-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-kelen-red-600">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Formulaire de signalement</p>
              <p className="text-xs text-muted-foreground">Tous les champs marqués * sont obligatoires</p>
            </div>
          </div>
          <SignalForm isExternal={true} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Les signalements font l'objet d'une vérification avant publication. Kelen se réserve le droit de rejeter tout signalement non fondé.
        </p>
      </div>
    </div>
  );
}
