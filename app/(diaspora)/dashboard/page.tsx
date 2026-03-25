import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tableau de bord — Kelen",
};

// Demo data — replaced by Supabase queries
const DEMO_USER = {
  first_name: "Fatou",
  last_name: "Diallo",
  email: "fatou@exemple.com",
  country: "FR",
};

const DEMO_ACTIVITY = {
  recommendations_submitted: 2,
  signals_submitted: 0,
  reviews_submitted: 3,
};

const DEMO_RECENT = [
  {
    id: "1",
    type: "recommendation" as const,
    professional_name: "Kouadio Construction",
    professional_slug: "kouadio-construction-abidjan",
    status: "verified" as const,
    created_at: "2024-12-15T00:00:00Z",
  },
  {
    id: "2",
    type: "review" as const,
    professional_name: "Kouadio Construction",
    professional_slug: "kouadio-construction-abidjan",
    status: "published" as const,
    created_at: "2024-11-10T00:00:00Z",
  },
  {
    id: "3",
    type: "recommendation" as const,
    professional_name: "Bamba Électricité",
    professional_slug: "bamba-electricite-dakar",
    status: "pending" as const,
    created_at: "2025-01-20T00:00:00Z",
  },
];

const STATUS_STYLES = {
  pending: { label: "En attente", className: "bg-kelen-yellow-50 text-kelen-yellow-700" },
  verified: { label: "Vérifié", className: "bg-kelen-green-50 text-kelen-green-700" },
  published: { label: "Publié", className: "bg-kelen-green-50 text-kelen-green-700" },
  rejected: { label: "Rejeté", className: "bg-kelen-red-50 text-kelen-red-700" },
};

const TYPE_LABELS = {
  recommendation: "Recommandation",
  signal: "Signal",
  review: "Avis",
};

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {DEMO_USER.first_name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenue sur votre espace Kelen
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/recherche"
          className="group rounded-xl border border-border bg-white p-6 transition-colors hover:border-kelen-green-500/30"
        >
          <span className="text-2xl">🔍</span>
          <h3 className="mt-3 font-semibold text-foreground">
            Vérifier un professionnel
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez le profil vérifié d&apos;un professionnel avant de vous engager.
          </p>
        </Link>

        <Link
          href="/recommandation"
          className="group rounded-xl border border-border bg-white p-6 transition-colors hover:border-kelen-green-500/30"
        >
          <span className="text-2xl">✓</span>
          <h3 className="mt-3 font-semibold text-foreground">
            Soumettre une recommandation
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Partagez votre expérience positive avec un professionnel.
          </p>
        </Link>

        <Link
          href="/signal"
          className="group rounded-xl border border-border bg-white p-6 transition-colors hover:border-kelen-red-500/30"
        >
          <span className="text-2xl">⚠</span>
          <h3 className="mt-3 font-semibold text-foreground">
            Signaler un manquement
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentez un manquement contractuel pour protéger la communauté.
          </p>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Recommandations</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_ACTIVITY.recommendations_submitted}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Signaux</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_ACTIVITY.signals_submitted}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Avis</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_ACTIVITY.reviews_submitted}
          </p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-white">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Activité récente</h2>
        </div>
        <div className="divide-y divide-border">
          {DEMO_RECENT.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {TYPE_LABELS[item.type]} —{" "}
                  <Link
                    href={`/pro/${item.professional_slug}`}
                    className="text-kelen-green-600 hover:text-kelen-green-700"
                  >
                    {item.professional_name}
                  </Link>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[item.status].className
                }`}
              >
                {STATUS_STYLES[item.status].label}
              </span>
            </div>
          ))}
          {DEMO_RECENT.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Aucune activité pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
