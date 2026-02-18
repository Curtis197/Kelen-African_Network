import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Administration — Kelen",
};

// Demo data
const DEMO_STATS = {
  total_professionals: 48,
  total_users: 215,
  pending_verifications: 6,
  recommendations_total: 132,
  signals_total: 8,
  reviews_total: 347,
};

const DEMO_RECENT_QUEUE = [
  {
    id: "q-1",
    type: "recommendation" as const,
    professional_name: "Kouadio Construction",
    submitter_name: "Fatou D.",
    created_at: "2025-02-17T10:30:00Z",
  },
  {
    id: "q-2",
    type: "signal" as const,
    professional_name: "Traoré BTP",
    submitter_name: "Anonyme",
    created_at: "2025-02-16T14:15:00Z",
  },
  {
    id: "q-3",
    type: "recommendation" as const,
    professional_name: "Bamba Électricité",
    submitter_name: "Jean-Pierre M.",
    created_at: "2025-02-15T09:00:00Z",
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Administration</h1>
      <p className="mt-1 text-muted-foreground">
        Vue d&apos;ensemble de la plateforme Kelen.
      </p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Professionnels</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.total_professionals}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Utilisateurs diaspora</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.total_users}
          </p>
        </div>
        <div className="rounded-xl border border-kelen-yellow-500/30 bg-kelen-yellow-50/30 p-5">
          <p className="text-sm text-muted-foreground">
            En attente de vérification
          </p>
          <p className="mt-1 text-2xl font-bold text-kelen-yellow-700">
            {DEMO_STATS.pending_verifications}
          </p>
          <Link
            href="/admin/queue"
            className="mt-2 inline-block text-xs text-kelen-green-600 hover:text-kelen-green-700"
          >
            Voir la file →
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Recommandations</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.recommendations_total}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Signaux</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.signals_total}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Avis</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.reviews_total}
          </p>
        </div>
      </div>

      {/* Recent queue items */}
      <div className="mt-8 rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">
            Dernières soumissions
          </h2>
          <Link
            href="/admin/queue"
            className="text-sm text-kelen-green-600 hover:text-kelen-green-700"
          >
            Tout voir →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {DEMO_RECENT_QUEUE.map((item) => (
            <Link
              key={item.id}
              href={`/admin/queue/${item.id}`}
              className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.type === "recommendation"
                        ? "bg-kelen-green-50 text-kelen-green-700"
                        : "bg-kelen-red-50 text-kelen-red-700"
                    }`}
                  >
                    {item.type === "recommendation"
                      ? "Recommandation"
                      : "Signal"}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {item.professional_name}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Par {item.submitter_name} ·{" "}
                  {new Date(item.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
