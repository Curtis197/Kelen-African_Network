import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getProDashboardStats } from "@/lib/actions/dashboard-stats";
import type { ProfessionalStatus } from "@/lib/supabase/types";
import { Suspense } from "react";
import { GoogleBusinessConnect } from "@/components/pro/GoogleBusinessConnect";
import { MarketingToolsSection } from "@/components/pro/MarketingToolsSection";
import {
  LayoutDashboard,
  Star,
  Eye,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  Edit,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tableau de bord Pro — Kelen",
};

export default async function ProDashboardPage() {
  const stats = await getProDashboardStats();

  if (!stats.professionalId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border bg-white text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container mb-5">
          <LayoutDashboard className="w-8 h-8 text-on-surface-variant/40" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">Profil introuvable</h3>
        <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
          Veuillez compléter votre profil pour accéder au tableau de bord.
        </p>
        <Link
          href="/pro/profil"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-kelen-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Edit className="w-4 h-4" /> Compléter mon profil
        </Link>
      </div>
    );
  }

  const hasPendingActions = stats.pendingRecommendations > 0 || stats.pendingSignals > 0;

  const statCards = [
    {
      label: "Recommandations",
      value: stats.recommendationCount,
      icon: <Star className="w-4 h-4" />,
      color: "bg-kelen-green-50 text-kelen-green-600",
      note: stats.recommendationCount === 0 ? "Aucune encore" : `dont ${stats.pendingRecommendations} en attente`,
    },
    {
      label: "Note moyenne",
      value: stats.avgRating > 0 ? `${stats.avgRating}/5` : "—",
      icon: <Star className="w-4 h-4" fill="currentColor" />,
      color: "bg-amber-50 text-amber-600",
      note: stats.avgRating > 0 ? "Sur 5 étoiles" : "Pas encore noté",
    },
    {
      label: "Vues ce mois",
      value: stats.monthlyViews,
      icon: <Eye className="w-4 h-4" />,
      color: "bg-blue-50 text-blue-600",
      note: "Visites de votre profil",
    },
    {
      label: "Abonnement",
      value: stats.subscriptionStatus,
      icon: <CreditCard className="w-4 h-4" />,
      color: stats.subscriptionStatus === "Premium"
        ? "bg-kelen-green-50 text-kelen-green-600"
        : "bg-surface-container text-on-surface-variant",
      note: stats.subscriptionStatus === "Premium" ? "Accès complet" : "Plan gratuit",
    },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-kelen-green-50 text-kelen-green-600 flex-shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              {stats.businessName || "Mon tableau de bord"}
            </h1>
            <div className="mt-1.5">
              <StatusBadge
                status={(stats.status as ProfessionalStatus) || "white"}
                recommendationCount={stats.recommendationCount}
                signalCount={stats.signalCount}
                avgRating={stats.avgRating}
                size="md"
              />
            </div>
          </div>
        </div>
        <Link
          href="/pro/profil"
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:border-primary/30 hover:text-on-surface transition-all bg-white"
        >
          <Edit className="w-4 h-4" /> Modifier mon profil
        </Link>
      </div>

      {/* ── Stat cards ────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {card.label}
              </p>
            </div>
            <p className="text-2xl font-black text-on-surface leading-none">{card.value}</p>
            <p className="text-[11px] text-on-surface-variant mt-1">{card.note}</p>
          </div>
        ))}
      </div>

      {/* ── Google Business ───────────────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          Visibilité Google Maps
        </p>
        <Suspense fallback={<div className="h-20 rounded-2xl border border-border bg-surface-container-low animate-pulse" />}>
          {stats.professionalId && (
            <GoogleBusinessConnect
              proId={stats.professionalId}
              isConnected={stats.gbp.isConnected}
              verificationStatus={stats.gbp.verificationStatus}
              lastSyncedAt={stats.gbp.lastSyncedAt}
              gbpLocationName={stats.gbp.gbpLocationName}
            />
          )}
        </Suspense>
      </div>

      {/* ── Marketing tools ───────────────────────────────── */}
      {stats.professionalId && (
        <MarketingToolsSection
          professionalId={stats.professionalId}
          isPremium={stats.subscriptionStatus === "Premium"}
        />
      )}

      {/* ── Pending actions ───────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          {hasPendingActions ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-kelen-green-500 flex-shrink-0" />
          )}
          <h2 className="text-sm font-bold text-on-surface">Actions requises</h2>
          {hasPendingActions && (
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              {stats.pendingRecommendations + stats.pendingSignals}
            </span>
          )}
        </div>

        <div className="divide-y divide-border">
          {hasPendingActions ? (
            <>
              {stats.pendingRecommendations > 0 && (
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-kelen-green-50 text-kelen-green-600 mt-0.5">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {stats.pendingRecommendations} recommandation{stats.pendingRecommendations > 1 ? "s" : ""} en attente
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Des témoignages clients nécessitent votre validation
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/pro/recommandations"
                    className="flex items-center gap-1 shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors bg-kelen-green-50 text-kelen-green-700 hover:bg-kelen-green-100"
                  >
                    Voir <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
              {stats.pendingSignals > 0 && (
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {stats.pendingSignals} signalement{stats.pendingSignals > 1 ? "s" : ""} sans réponse
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Répondez dans les 15 jours pour préserver votre réputation
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/pro/signal"
                    className="flex items-center gap-1 shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    Répondre <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 px-5 py-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kelen-green-50 text-kelen-green-500 flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-sm text-on-surface-variant">
                Tout est en ordre — aucune action requise pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
