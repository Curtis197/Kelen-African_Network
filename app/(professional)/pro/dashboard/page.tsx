import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getProDashboardStats } from "@/lib/actions/dashboard-stats";
import type { ProfessionalStatus } from "@/lib/supabase/types";
import { Suspense } from "react";
import { GoogleBusinessConnect } from "@/components/pro/GoogleBusinessConnect";

export const metadata: Metadata = {
  title: "Tableau de bord Pro — Kelen",
};

export default async function ProDashboardPage() {
  const stats = await getProDashboardStats();

  if (!stats.professionalId) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Profil professionnel introuvable. Veuillez compléter votre profil.</p>
        <Link
          href="/pro/profil"
          className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Compléter mon profil
        </Link>
      </div>
    );
  }

  const hasPendingActions = stats.pendingRecommendations > 0 || stats.pendingSignals > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {stats.businessName || "Mon profil"}
          </h1>
          <div className="mt-2">
            <StatusBadge
              status={(stats.status as ProfessionalStatus) || "white"}
              recommendationCount={stats.recommendationCount}
              signalCount={stats.signalCount}
              avgRating={stats.avgRating}
              size="md"
            />
          </div>
        </div>
        <Link
          href="/pro/profil"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Modifier mon profil
        </Link>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-container-low p-5">
          <p className="text-sm text-muted-foreground">Recommandations</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {stats.recommendationCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-container-low p-5">
          <p className="text-sm text-muted-foreground">Note moyenne</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {stats.avgRating > 0 ? `${stats.avgRating} / 5` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-container-low p-5">
          <p className="text-sm text-muted-foreground">Vues ce mois</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {stats.monthlyViews}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-container-low p-5">
          <p className="text-sm text-muted-foreground">Abonnement</p>
          <p className="mt-1 text-2xl font-bold text-kelen-green-600 dark:text-kelen-green-400">
            {stats.subscriptionStatus}
          </p>
        </div>
      </div>

      {/* Google Business Profile */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Visibilité Google Maps
        </h2>
        <Suspense fallback={<div className="h-20 rounded-xl border border-border bg-surface-container-low animate-pulse" />}>
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

      {/* Pending actions */}
      <div className="rounded-xl border border-border bg-surface-container-low">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Actions requises</h2>
        </div>
        <div className="divide-y divide-border">
          {hasPendingActions ? (
            <>
              {stats.pendingRecommendations > 0 && (
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {stats.pendingRecommendations} recommandation{stats.pendingRecommendations > 1 ? "s" : ""} en attente
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Des témoignages clients nécessitent votre validation
                    </p>
                  </div>
                  <Link
                    href="/pro/recommandations"
                    className="shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition-colors bg-kelen-green-50 text-kelen-green-700 hover:bg-kelen-green-100 dark:bg-kelen-green-900/30 dark:text-kelen-green-400 dark:hover:bg-kelen-green-900/50"
                  >
                    Voir
                  </Link>
                </div>
              )}
              {stats.pendingSignals > 0 && (
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {stats.pendingSignals} signalement{stats.pendingSignals > 1 ? "s" : ""} en attente
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Répondez dans les 15 jours pour préserver votre réputation
                    </p>
                  </div>
                  <Link
                    href="/pro/signal"
                    className="shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition-colors bg-kelen-red-50 text-kelen-red-700 hover:bg-kelen-red-100 dark:bg-kelen-red-900/30 dark:text-kelen-red-400 dark:hover:bg-kelen-red-900/50"
                  >
                    Répondre
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Aucune action requise pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
