import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatRating } from "@/lib/utils/format";
import type { ProfessionalStatus } from "@/lib/supabase/types";

interface ProfessionalCardProps {
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
}

export function ProfessionalCard({
  slug,
  businessName,
  ownerName,
  category,
  city,
  country,
  status,
  recommendationCount,
  signalCount,
  avgRating,
  reviewCount,
}: ProfessionalCardProps) {
  return (
    <Link
      href={`/pro/${slug}`}
      className="group block rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-foreground group-hover:text-kelen-green-500">
            {businessName}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ownerName}
          </p>
        </div>
        <StatusBadge
          status={status}
          recommendationCount={recommendationCount}
          signalCount={signalCount}
          avgRating={avgRating}
          size="sm"
          showDetails={false}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>{category}</span>
        <span className="text-border">·</span>
        <span>{city}, {country}</span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        {recommendationCount > 0 && (
          <span className="text-kelen-green-700">
            {recommendationCount} projet{recommendationCount > 1 ? "s" : ""} vérifié{recommendationCount > 1 ? "s" : ""}
          </span>
        )}
        {signalCount > 0 && (
          <span className="text-kelen-red-700">
            {signalCount} signal{signalCount > 1 ? "s" : ""}
          </span>
        )}
        {avgRating !== null && (
          <span className="text-muted-foreground">
            ★ {formatRating(avgRating)} ({reviewCount} avis)
          </span>
        )}
        {recommendationCount === 0 && signalCount === 0 && (
          <span className="text-muted-foreground">
            Aucun historique documenté
          </span>
        )}
      </div>
    </Link>
  );
}
