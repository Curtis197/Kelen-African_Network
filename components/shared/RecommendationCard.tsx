import { formatDate, getCountryName } from "@/lib/utils/format";
import type { BudgetRange } from "@/lib/supabase/types";

interface RecommendationCardProps {
  projectType: string;
  projectDescription: string;
  completionDate: string;
  budgetRange: BudgetRange;
  location: string;
  submitterName: string;
  submitterCountry: string;
  photoUrls: string[];
  linked: boolean;
}

const BUDGET_LABELS: Record<BudgetRange, string> = {
  "0-10k": "0 — 10 000 €",
  "10k-25k": "10 000 — 25 000 €",
  "25k-50k": "25 000 — 50 000 €",
  "50k-100k": "50 000 — 100 000 €",
  "100k+": "100 000 € +",
};

export function RecommendationCard({
  projectType,
  projectDescription,
  completionDate,
  budgetRange,
  location,
  submitterName,
  submitterCountry,
  linked,
}: RecommendationCardProps) {
  return (
    <div className="rounded-xl border border-kelen-green-500/20 bg-kelen-green-50/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-kelen-green-500">✓</span>
            <h4 className="font-semibold text-foreground">
              {projectType} · {location}
            </h4>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Terminé le {formatDate(completionDate)} · Budget : {BUDGET_LABELS[budgetRange]}
          </p>
        </div>
        {linked && (
          <span className="shrink-0 rounded-full bg-kelen-green-50 px-2.5 py-0.5 text-xs font-medium text-kelen-green-700 border border-kelen-green-500/20">
            Lié au profil
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        {projectDescription}
      </p>

      <div className="mt-4 text-xs text-muted-foreground">
        — {submitterName}, {getCountryName(submitterCountry)}
      </div>
    </div>
  );
}
