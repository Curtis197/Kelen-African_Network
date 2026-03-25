import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ProfessionalStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Tableau de bord Pro — Kelen",
};

// Demo data
const DEMO_PRO = {
  business_name: "Kouadio Construction",
  status: "gold" as ProfessionalStatus,
  recommendation_count: 7,
  signal_count: 0,
  avg_rating: 4.8,
  review_count: 12,
  monthly_views: 342,
  credits_remaining: 15000,
};

const DEMO_PENDING = [
  {
    id: "1",
    type: "recommendation" as const,
    submitter_name: "Fatou D.",
    created_at: "2025-02-10T00:00:00Z",
    status: "pending_link" as const,
  },
  {
    id: "2",
    type: "signal" as const,
    submitter_name: "Anonyme",
    created_at: "2025-02-08T00:00:00Z",
    status: "pending_response" as const,
  },
];

export default function ProDashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {DEMO_PRO.business_name}
          </h1>
          <div className="mt-2">
            <StatusBadge
              status={DEMO_PRO.status}
              recommendationCount={DEMO_PRO.recommendation_count}
              signalCount={DEMO_PRO.signal_count}
              avgRating={DEMO_PRO.avg_rating}
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
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Recommandations</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_PRO.recommendation_count}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Note moyenne</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_PRO.avg_rating} / 5
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Vues ce mois</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_PRO.monthly_views}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Crédits restants</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {(DEMO_PRO.credits_remaining / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Pending actions */}
      <div className="rounded-xl border border-border bg-white">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Actions requises</h2>
        </div>
        <div className="divide-y divide-border">
          {DEMO_PENDING.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.type === "recommendation"
                    ? "Nouvelle recommandation à lier"
                    : "Signal — réponse requise"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  De {item.submitter_name} ·{" "}
                  {new Date(item.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Link
                href={
                  item.type === "recommendation"
                    ? "/pro/recommandations"
                    : "/pro/signal"
                }
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                  item.type === "signal"
                    ? "bg-kelen-red-50 text-kelen-red-700 hover:bg-kelen-red-100"
                    : "bg-kelen-green-50 text-kelen-green-700 hover:bg-kelen-green-100"
                }`}
              >
                {item.type === "recommendation" ? "Voir" : "Répondre"}
              </Link>
            </div>
          ))}
          {DEMO_PENDING.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Aucune action requise pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
