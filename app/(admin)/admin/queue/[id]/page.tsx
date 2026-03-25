import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vérification — Kelen Admin",
};

// Demo data — replaced by Supabase query
const DEMO_ITEM = {
  id: "q-1",
  type: "recommendation" as const,
  status: "pending" as const,
  created_at: "2025-02-17T10:30:00Z",
  professional: {
    name: "Kouadio Construction",
    slug: "kouadio-construction-abidjan",
    category: "Construction",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    status: "gold",
  },
  submitter: {
    name: "Fatou D.",
    email: "fatou@exemple.com",
    country: "FR",
    account_created: "2024-06-15T00:00:00Z",
    submissions_count: 3,
  },
  recommendation: {
    project_type: "Construction résidentielle",
    project_description:
      "Construction d'une villa R+1 de 4 chambres à Cocody. Travaux livrés dans les délais avec une qualité irréprochable. Communication constante tout au long du projet.",
    completion_date: "2024-12-15",
    budget_range: "50k-100k",
    location: "Cocody, Abidjan",
    photo_urls: [],
  },
};

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;

  // TODO: Replace with Supabase query
  const item = id === DEMO_ITEM.id ? DEMO_ITEM : null;

  if (!item) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Élément non trouvé
        </h1>
        <Link
          href="/admin/queue"
          className="mt-4 inline-block text-sm text-kelen-green-600 hover:text-kelen-green-700"
        >
          ← Retour à la file
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/admin/queue"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour à la file
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          Vérification #{item.id}
        </h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            item.type === "recommendation"
              ? "bg-kelen-green-50 text-kelen-green-700"
              : "bg-kelen-red-50 text-kelen-red-700"
          }`}
        >
          {item.type === "recommendation" ? "Recommandation" : "Signal"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission details */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">
              Détails de la soumission
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type de projet</dt>
                <dd className="font-medium text-foreground">
                  {item.recommendation.project_type}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lieu</dt>
                <dd className="font-medium text-foreground">
                  {item.recommendation.location}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date de fin</dt>
                <dd className="font-medium text-foreground">
                  {new Date(
                    item.recommendation.completion_date
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Budget</dt>
                <dd className="font-medium text-foreground">
                  {item.recommendation.budget_range}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {item.recommendation.project_description}
              </p>
            </div>

            {/* Photos placeholder */}
            {item.recommendation.photo_urls.length === 0 && (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                Aucune photo jointe
              </div>
            )}
          </div>

          {/* Admin decision */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">Décision</h2>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Note interne (optionnel)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                placeholder="Ajouter une note de vérification..."
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button className="flex-1 rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600">
                Approuver
              </button>
              <button className="flex-1 rounded-lg bg-kelen-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-red-600">
                Rejeter
              </button>
              <button className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                Demander des infos
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Professional info */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground">Professionnel</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-foreground">
                {item.professional.name}
              </p>
              <p className="text-muted-foreground">
                {item.professional.category}
              </p>
              <p className="text-muted-foreground">
                {item.professional.city}, {item.professional.country}
              </p>
              <p className="text-muted-foreground">
                Statut actuel :{" "}
                <span className="font-medium capitalize">
                  {item.professional.status}
                </span>
              </p>
              <Link
                href={`/pro/${item.professional.slug}`}
                className="mt-2 inline-block text-xs text-kelen-green-600 hover:text-kelen-green-700"
              >
                Voir le profil public →
              </Link>
            </div>
          </div>

          {/* Submitter info */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground">Soumis par</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-foreground">
                {item.submitter.name}
              </p>
              <p className="text-muted-foreground">{item.submitter.email}</p>
              <p className="text-muted-foreground">
                Pays : {item.submitter.country}
              </p>
              <p className="text-muted-foreground">
                Compte créé le{" "}
                {new Date(item.submitter.account_created).toLocaleDateString(
                  "fr-FR",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              </p>
              <p className="text-muted-foreground">
                {item.submitter.submissions_count} soumissions au total
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground">Chronologie</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-kelen-yellow-500" />
                <span className="text-muted-foreground">
                  Soumis le{" "}
                  {new Date(item.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-border" />
                <span className="text-muted-foreground">
                  En attente de vérification
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
