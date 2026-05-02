import type { Metadata } from "next";
import { ProProfileForm } from "@/components/forms/ProProfileForm";

export const metadata: Metadata = {
  title: "Mon profil — Kelen Pro",
};

export default function ProProfilePage() {
  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {/* ── Amber gradient page header ─────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-border"
        style={{
          background:
            "linear-gradient(135deg, #78350f 0%, #92400e 40%, #b45309 100%)",
        }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cpolygon points="20,3 37,30 3,30" fill="none" stroke="white" stroke-width="1"/%3E%3C/svg%3E\')',
            backgroundSize: "40px 40px",
          }}
        />
        {/* Bottom amber glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-kelen-yellow-500/20 blur-3xl rounded-full" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Pro icon */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white/80 ring-1 ring-white/10">
                  <span aria-hidden="true">✦</span>
                  Espace Professionnel
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Mon profil
                </h1>
                <p className="mt-0.5 text-sm text-white/60">
                  Gérez l'apparence de votre page publique
                </p>
              </div>
            </div>
          </div>

          {/* Info strip */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Modifications enregistrées en temps réel
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Visible publiquement après validation
            </span>
          </div>
        </div>

        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0 flex h-0.5">
          <div className="flex-1 bg-kelen-green-400/40" />
          <div className="flex-1 bg-kelen-yellow-400/60" />
          <div className="flex-1 bg-kelen-red-400/40" />
        </div>
      </div>

      {/* ── Form area ──────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <ProProfileForm />
      </div>
    </div>
  );
}
