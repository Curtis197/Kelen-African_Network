import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Rechercher un professionnel",
  description:
    "Vérifiez le parcours documenté de tout professionnel référencé sur Kelen.",
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const mode = typeof params.mode === "string" ? params.mode : "lookup";
  const supabase = await createClient();

  let browserQuery = supabase
    .from("professionals")
    .select("*")
    .eq("is_active", true)
    .eq("is_visible", true);

  // Black-listed professionals appear in name lookup (verification) but not in discovery
  if (mode === "browse") {
    browserQuery = browserQuery.neq("status", "black");
  }

  // Text search
  if (query) {
    browserQuery = browserQuery.or(
      `business_name.ilike.%${query}%,owner_name.ilike.%${query}%`
    );
  }

  // Filters (browse mode)
  if (mode === "browse") {
    const category = typeof params.category === "string" ? params.category : "";
    const country = typeof params.country === "string" ? params.country : "";
    const statusFilter = typeof params.status === "string" ? params.status : "";

    if (category) {
      browserQuery = browserQuery.eq("category", category);
    }
    if (country) {
      browserQuery = browserQuery.eq("country", country);
    }
    if (statusFilter) {
      const statuses = statusFilter.split(",");
      browserQuery = browserQuery.in("status", statuses);
    }
  }

  // Sort by signal_count DESC to prioritize profiles needing verification/attention
  const { data: results, error } = await browserQuery.order("signal_count", {
    ascending: false,
  });

  if (error) {
    console.error("Search error:", error);
  }

  const hasQuery = query.length > 0 || mode === "browse";
  const finalResults = results || [];

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
        {hasQuery && finalResults.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {finalResults.length} résultat{finalResults.length > 1 ? "s" : ""}
              {query && (
                <>
                  {" "}pour « <span className="font-medium text-foreground">{query}</span> »
                </>
              )}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {finalResults.map((pro: any) => (
                <ProfessionalCard
                  key={pro.slug}
                  id={pro.id}
                  slug={pro.slug}
                  businessName={pro.business_name}
                  ownerName={pro.owner_name}
                  category={pro.category}
                  city={pro.city}
                  country={pro.country}
                  status={pro.status}
                  recommendationCount={pro.recommendation_count}
                  signalCount={pro.signal_count}
                  avgRating={pro.avg_rating}
                  reviewCount={pro.review_count}
                />
              ))}
            </div>
          </>
        )}

        {hasQuery && finalResults.length === 0 && (
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
