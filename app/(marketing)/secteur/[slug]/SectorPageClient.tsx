"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { getProfessionalsByArea } from "@/lib/actions/professionals";
import { getSectorIcon } from "@/lib/utils/sector-icons";
import type { ProfessionalArea, Profession } from "@/lib/types/taxonomy";
import type { Professional } from "@/lib/supabase/types";

interface SectorPageClientProps {
  area: ProfessionalArea;
  professions: Profession[];
  initialProfessionals: Professional[];
  initialTotalCount: number;
}

export function SectorPageClient({
  area,
  professions,
  initialProfessionals,
  initialTotalCount,
}: SectorPageClientProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const Icon = getSectorIcon(area.slug);

  const refresh = (professionSlug: string | null, loc: string) => {
    const params = new URLSearchParams();
    if (professionSlug) params.set("profession", professionSlug);
    if (loc) params.set("location", loc);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    startTransition(async () => {
      try {
        const result = await getProfessionalsByArea(
          area.slug,
          professionSlug ?? undefined,
          loc || undefined
        );
        setProfessionals(result.professionals);
        setTotalCount(result.totalCount);
      } catch {
      }
    });
  };

  const handleChipSelect = (slug: string | null) => {
    setSelectedSlug(slug);
    refresh(slug, location);
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refresh(selectedSlug, location);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-2xl bg-surface-container-low p-3">
          <Icon className="h-10 w-10 text-kelen-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{area.name}</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} professionnel{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Profession chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => handleChipSelect(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
            selectedSlug === null
              ? "bg-kelen-green-600 text-white"
              : "bg-surface-container-low text-on-surface hover:bg-kelen-green-50"
          }`}
        >
          Tous
        </button>
        {professions.map((p) => (
          <button
            key={p.id}
            onClick={() => handleChipSelect(p.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              selectedSlug === p.slug
                ? "bg-kelen-green-600 text-white"
                : "bg-surface-container-low text-on-surface hover:bg-kelen-green-50"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Location filter */}
      <form onSubmit={handleLocationSubmit} className="mb-8 flex max-w-sm gap-2">
        <input
          type="text"
          placeholder="Ville ou pays"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-kelen-green-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-2xl bg-kelen-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-kelen-green-700"
        >
          OK
        </button>
      </form>

      {/* Results */}
      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-kelen-green-600" />
        </div>
      ) : professionals.length > 0 ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {professionals.map((pro) => {
            const portfolio = (pro as any).professional_portfolio?.[0];
            const customDomain =
              portfolio?.domain_status === "active" ? portfolio.custom_domain : null;
            return (
              <ProfessionalCard
                key={`${pro.id}-${pro.slug}`}
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
                profilePictureUrl={pro.portfolio_photos?.[0]}
                customDomain={customDomain}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg font-bold text-on-surface">Aucun professionnel dans cette catégorie</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Essayez une autre ville ou retirez le filtre de profession.
          </p>
        </div>
      )}
    </main>
  );
}
