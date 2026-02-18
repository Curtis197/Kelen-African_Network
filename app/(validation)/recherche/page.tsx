import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ProfessionalStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Rechercher un professionnel",
  description:
    "Vérifiez le parcours documenté de tout professionnel référencé sur Kelen.",
};

// Demo data — replaced by Supabase queries when backend is connected
const DEMO_PROFESSIONALS: Array<{
  slug: string;
  businessName: string;
  ownerName: string;
  category: string;
  city: string;
  country: string;
  status: ProfessionalStatus;
  recommendationCount: number;
  signalCount: number;
  avgRating: number | null;
  reviewCount: number;
}> = [
  {
    slug: "kouadio-construction-abidjan",
    businessName: "Kouadio Construction",
    ownerName: "Moussa Kouadio",
    category: "Construction",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    status: "gold",
    recommendationCount: 7,
    signalCount: 0,
    avgRating: 4.8,
    reviewCount: 12,
  },
  {
    slug: "diallo-batiment-dakar",
    businessName: "Diallo Bâtiment",
    ownerName: "Amadou Diallo",
    category: "Construction",
    city: "Dakar",
    country: "Sénégal",
    status: "silver",
    recommendationCount: 3,
    signalCount: 0,
    avgRating: 4.2,
    reviewCount: 5,
  },
  {
    slug: "traore-electricite-bamako",
    businessName: "Traoré Électricité",
    ownerName: "Ibrahim Traoré",
    category: "Électricité",
    city: "Bamako",
    country: "Mali",
    status: "white",
    recommendationCount: 0,
    signalCount: 0,
    avgRating: null,
    reviewCount: 0,
  },
  {
    slug: "bamba-renovation-abidjan",
    businessName: "Bamba Rénovation",
    ownerName: "Sékou Bamba",
    category: "Rénovation",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    status: "red",
    recommendationCount: 4,
    signalCount: 1,
    avgRating: 3.1,
    reviewCount: 8,
  },
];

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const mode = typeof params.mode === "string" ? params.mode : "lookup";

  // TODO: Replace with Supabase queries
  // For now, filter demo data client-side
  let results = DEMO_PROFESSIONALS;

  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.businessName.toLowerCase().includes(lowerQuery) ||
        p.ownerName.toLowerCase().includes(lowerQuery)
    );
  }

  if (mode === "browse") {
    // In browse mode, only show visible (would be is_visible = true in production)
    const category = typeof params.category === "string" ? params.category : "";
    const country = typeof params.country === "string" ? params.country : "";
    const statusFilter = typeof params.status === "string" ? params.status : "";

    if (category) {
      results = results.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (country) {
      results = results.filter((p) => p.country === country);
    }
    if (statusFilter) {
      const statuses = statusFilter.split(",");
      results = results.filter((p) => statuses.includes(p.status));
    }
  }

  // Always exclude black list from search results
  results = results.filter((p) => p.status !== "black");

  const hasQuery = query.length > 0 || mode === "browse";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Rechercher un professionnel
        </h1>
        <p className="mt-2 text-muted-foreground">
          Vérifiez le parcours documenté de tout professionnel référencé sur
          Kelen.
        </p>
      </div>

      {/* Search bar */}
      <Suspense fallback={null}>
        <SearchBar defaultValue={query} size="lg" />
      </Suspense>

      {/* Filters */}
      <div className="mt-6">
        <Suspense fallback={null}>
          <FilterPanel />
        </Suspense>
      </div>

      {/* Results */}
      <div className="mt-8">
        {hasQuery && results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {results.length} résultat{results.length > 1 ? "s" : ""}
              {query && (
                <>
                  {" "}pour « <span className="font-medium text-foreground">{query}</span> »
                </>
              )}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((pro) => (
                <ProfessionalCard key={pro.slug} {...pro} />
              ))}
            </div>
          </>
        )}

        {hasQuery && results.length === 0 && (
          <EmptyState
            title="Aucun résultat"
            description="Ce professionnel n'est pas encore référencé sur Kelen. L'absence de résultat ne constitue ni une recommandation, ni un avertissement."
            action={
              <Link
                href="/recherche"
                className="inline-flex rounded-lg bg-kelen-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-kelen-green-600"
              >
                Nouvelle recherche
              </Link>
            }
          />
        )}

        {!hasQuery && (
          <div className="rounded-xl border border-border bg-muted/30 px-6 py-12 text-center">
            <p className="text-lg font-medium text-foreground">
              Tapez un nom pour vérifier un professionnel
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ou passez en mode « Trouver » pour parcourir par catégorie et
              localisation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
