import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { SignalCard } from "@/components/shared/SignalCard";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { formatTenure, formatRating, formatNumber } from "@/lib/utils/format";
import type { ProfessionalStatus } from "@/lib/supabase/types";

// Demo data — replaced by Supabase query on slug
const DEMO_PRO = {
  id: "demo-1",
  slug: "kouadio-construction-abidjan",
  business_name: "Kouadio Construction",
  owner_name: "Moussa Kouadio",
  category: "Construction",
  city: "Abidjan",
  country: "Côte d'Ivoire",
  status: "gold" as ProfessionalStatus,
  recommendation_count: 7,
  signal_count: 0,
  avg_rating: 4.8,
  positive_review_pct: 95,
  review_count: 12,
  is_visible: true,
  verified: true,
  created_at: "2021-03-15T00:00:00Z",
  description:
    "Construction résidentielle et rénovation à Abidjan depuis 2009. Spécialisé dans les projets de la diaspora.",
  services_offered: ["Construction neuve", "Rénovation complète", "Extension", "Gros œuvre"],
  phone: "+225 07 00 00 00",
  whatsapp: "+225 07 00 00 00",
  email: "contact@kouadio-construction.ci",
  years_experience: 15,
  team_size: 12,
};

const DEMO_RECOMMENDATIONS = [
  {
    id: "rec-1",
    projectType: "Construction résidentielle",
    projectDescription:
      "Construction d'une villa R+1 de 4 chambres à Cocody. Travaux livrés dans les délais avec une qualité irréprochable. Communication constante tout au long du projet.",
    completionDate: "2024-12-15",
    budgetRange: "50k-100k" as const,
    location: "Cocody, Abidjan",
    submitterName: "Fatou D.",
    submitterCountry: "FR",
    photoUrls: [],
    linked: true,
  },
  {
    id: "rec-2",
    projectType: "Rénovation",
    projectDescription:
      "Rénovation complète d'un appartement de 120m². Budget respecté, délai respecté. Équipe professionnelle et réactive.",
    completionDate: "2024-08-20",
    budgetRange: "25k-50k" as const,
    location: "Plateau, Abidjan",
    submitterName: "Amadou S.",
    submitterCountry: "BE",
    photoUrls: [],
    linked: true,
  },
];

const DEMO_SIGNALS: Array<{
  id: string;
  breachType: "timeline" | "budget" | "quality" | "abandonment" | "fraud";
  breachDescription: string;
  severity: "minor" | "major" | "critical";
  agreedStartDate: string;
  agreedEndDate: string;
  timelineDeviation: string | null;
  budgetDeviation: string | null;
  proResponse: string | null;
  proRespondedAt: string | null;
  createdAt: string;
}> = [];

const DEMO_REVIEWS = [
  {
    id: "rev-1",
    rating: 5,
    comment: "Excellent travail. Je recommande vivement pour tout projet de construction à Abidjan.",
    reviewerName: "Marie K.",
    reviewerCountry: "FR",
    createdAt: "2024-11-10T00:00:00Z",
  },
  {
    id: "rev-2",
    rating: 5,
    comment: "Professionnel sérieux, respecte ses engagements.",
    reviewerName: "Jean-Pierre M.",
    reviewerCountry: "CH",
    createdAt: "2024-09-05T00:00:00Z",
  },
  {
    id: "rev-3",
    rating: 4,
    comment: null,
    reviewerName: "Aïssata T.",
    reviewerCountry: "FR",
    createdAt: "2024-07-18T00:00:00Z",
  },
];

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  // TODO: Fetch from Supabase
  const pro = DEMO_PRO;
  if (slug !== pro.slug) {
    return { title: "Professionnel non trouvé" };
  }
  return {
    title: `${pro.business_name} — Profil Kelen`,
    description: `Consultez le profil vérifié de ${pro.business_name} sur Kelen. ${pro.recommendation_count} projets vérifiés.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;

  // TODO: Replace with Supabase query
  const pro = slug === DEMO_PRO.slug ? DEMO_PRO : null;

  if (!pro) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">
          Professionnel non trouvé
        </h1>
        <p className="mt-3 text-muted-foreground">
          Ce professionnel n&apos;est pas référencé sur Kelen.
        </p>
        <Link
          href="/recherche"
          className="mt-6 inline-flex rounded-lg bg-kelen-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-kelen-green-600"
        >
          Rechercher un professionnel
        </Link>
      </div>
    );
  }

  const isRed = pro.status === "red";
  const isBlack = pro.status === "black";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Red / Black alert banners */}
      {isRed && (
        <div className="mb-6 rounded-xl border border-kelen-red-500 bg-kelen-red-50 p-4">
          <p className="font-semibold text-kelen-red-800">
            🔴 Ce professionnel est sur Liste Rouge. Un manquement contractuel
            documenté a été vérifié.
          </p>
        </div>
      )}
      {isBlack && (
        <div className="mb-6 rounded-xl border border-[#1A1A1A] bg-[#1A1A1A] p-4">
          <p className="font-semibold text-white">
            ⚫ Ce professionnel est sur Liste Noire. Plusieurs manquements
            contractuels documentés ont été vérifiés.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {pro.business_name}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            {pro.owner_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{pro.category}</span>
            <span className="text-border">·</span>
            <span>{pro.city}, {pro.country}</span>
            <span className="text-border">·</span>
            <span>Actif depuis {formatTenure(pro.created_at)}</span>
          </div>
          <div className="mt-4">
            <StatusBadge
              status={pro.status}
              recommendationCount={pro.recommendation_count}
              signalCount={pro.signal_count}
              avgRating={pro.avg_rating}
              size="lg"
            />
          </div>
        </div>

        {/* Stats summary */}
        <div className="flex gap-6 rounded-xl border border-border bg-muted/50 p-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {pro.recommendation_count}
            </p>
            <p className="text-xs text-muted-foreground">Projets vérifiés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {pro.avg_rating ? formatRating(pro.avg_rating) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Note moyenne</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {formatNumber(pro.review_count)}
            </p>
            <p className="text-xs text-muted-foreground">Avis</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {pro.signal_count}
            </p>
            <p className="text-xs text-muted-foreground">Signaux</p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-10">
          {/* Recommendations */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Recommandations vérifiées ({DEMO_RECOMMENDATIONS.length})
            </h2>
            <div className="mt-4 space-y-4">
              {DEMO_RECOMMENDATIONS.map((rec) => (
                <RecommendationCard key={rec.id} {...rec} />
              ))}
              {DEMO_RECOMMENDATIONS.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucune recommandation vérifiée pour le moment.
                </p>
              )}
            </div>
          </section>

          {/* Signals */}
          {DEMO_SIGNALS.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-foreground">
                Signaux vérifiés ({DEMO_SIGNALS.length})
              </h2>
              <div className="mt-4 space-y-4">
                {DEMO_SIGNALS.map((sig) => (
                  <SignalCard key={sig.id} {...sig} />
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Avis ({DEMO_REVIEWS.length})
            </h2>
            <div className="mt-4 space-y-4">
              {DEMO_REVIEWS.map((rev) => (
                <ReviewCard key={rev.id} {...rev} />
              ))}
              {DEMO_REVIEWS.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun avis pour le moment.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar — 1/3 */}
        <aside className="space-y-6">
          {/* Contact — only if visible */}
          {pro.is_visible && !isBlack && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold text-foreground">Contact</h3>
              <div className="mt-4 space-y-3">
                <a
                  href={`tel:${pro.phone}`}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  📞 {pro.phone}
                </a>
                {pro.whatsapp && (
                  <a
                    href={`https://wa.me/${pro.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-kelen-green-500 bg-kelen-green-50 px-4 py-3 text-sm font-medium text-kelen-green-700 transition-colors hover:bg-kelen-green-100"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <a
                  href={`mailto:${pro.email}`}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  ✉ {pro.email}
                </a>
              </div>
            </div>
          )}

          {!pro.is_visible && !isBlack && (
            <div className="rounded-xl border border-border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Les coordonnées de ce professionnel ne sont pas disponibles
                actuellement.
              </p>
            </div>
          )}

          {/* About */}
          {pro.is_visible && pro.description && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold text-foreground">À propos</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {pro.description}
              </p>
              {pro.services_offered && pro.services_offered.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Services
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pro.services_offered.map((service) => (
                      <span
                        key={service}
                        className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {pro.years_experience && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {pro.years_experience} ans d&apos;expérience · Équipe de{" "}
                  {pro.team_size} personnes
                </p>
              )}
            </div>
          )}

          {/* Submit CTA */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground">
              Vous avez travaillé avec ce professionnel ?
            </h3>
            <div className="mt-4 space-y-2">
              <Link
                href={`/recommandation/${pro.slug}`}
                className="block w-full rounded-lg bg-kelen-green-500 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
              >
                Soumettre une recommandation
              </Link>
              <Link
                href={`/signal/${pro.slug}`}
                className="block w-full rounded-lg border border-kelen-red-500 px-4 py-2.5 text-center text-sm font-medium text-kelen-red-500 transition-colors hover:bg-kelen-red-50"
              >
                Signaler un manquement
              </Link>
              <Link
                href={`/avis/${pro.slug}`}
                className="block w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Laisser un avis
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
