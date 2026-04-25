import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  const PAGE_SIZE = 12;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const mode = typeof params.mode === "string" ? params.mode : "lookup";
  const supabase = await createClient();

  let browserQuery = supabase
    .from("professionals")
    .select("*, professional_portfolio(custom_domain, domain_status)", { count: "exact" })
    .eq("is_active", true)
    .eq("is_visible", true);

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

  // Sort by signal_count DESC
  // Range for pagination
  const { data: results, count, error } = await browserQuery
    .order("signal_count", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Search error:", error);
  }

  const finalResults = results || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  console.log('[DB] recherche professionals query:', {
    count: finalResults.length,
    withCustomDomain: finalResults.filter((p: any) => {
      const pp = (p.professional_portfolio as any)?.[0];
      return pp?.domain_status === 'active' && pp?.custom_domain;
    }).length,
    error: error?.message,
    errorCode: error?.code,
  });

  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on professionals query in recherche!');
  }
  if (!error && finalResults.length === 0) {
    console.warn('[RLS] ⚠️ POTENTIAL SILENT RLS FILTERING on professionals in recherche');
  }

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
        {hasQuery && finalResults.length > 0 && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Affichage de <span className="font-medium text-foreground">{from + 1}</span> à{" "}
                <span className="font-medium text-foreground">
                  {Math.min(from + finalResults.length, totalCount)}
                </span>{" "}
                sur <span className="font-medium text-foreground">{totalCount}</span> professionnel{totalCount > 1 ? "s" : ""}
                {query && (
                  <>
                    {" "}pour « <span className="font-medium text-foreground">{query}</span> »
                  </>
                )}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Link
                    href={{
                      query: { ...params, page: Math.max(1, page - 1) },
                    }}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                      page === 1 && "pointer-events-none opacity-50"
                    )}
                  >
                    Précédent
                  </Link>
                  <div className="flex items-center gap-1 px-2 text-sm font-medium">
                    <span>{page}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{totalPages}</span>
                  </div>
                  <Link
                    href={{
                      query: { ...params, page: Math.min(totalPages, page + 1) },
                    }}
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                      page === totalPages && "pointer-events-none opacity-50"
                    )}
                  >
                    Suivant
                  </Link>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {finalResults.map((pro: any) => {
                const portfolio = (pro.professional_portfolio as any)?.[0];
                const customDomain =
                  portfolio?.domain_status === 'active' ? portfolio.custom_domain : null;

                return (
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
                    customDomain={customDomain}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <Link
                  href={{
                    query: { ...params, page: Math.max(1, page - 1) },
                  }}
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl border-2 border-outline-variant/30 bg-background px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted",
                    page === 1 && "pointer-events-none opacity-30"
                  )}
                >
                  Page Précédente
                </Link>
                <div className="h-10 w-px bg-border" />
                <Link
                  href={{
                    query: { ...params, page: Math.min(totalPages, page + 1) },
                  }}
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl border-2 border-outline-variant/30 bg-background px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted",
                    page === totalPages && "pointer-events-none opacity-30"
                  )}
                >
                  Page Suivante
                </Link>
              </div>
            )}
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
