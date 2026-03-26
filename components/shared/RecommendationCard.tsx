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
    <div className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <h4 className="font-headline font-bold text-lg text-on-surface">
              {projectType}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-on-surface-variant/70 uppercase tracking-wider">
            <span>{location}</span>
            <span className="text-outline-variant/50">·</span>
            <span>{formatDate(completionDate)}</span>
            <span className="text-outline-variant/50">·</span>
            <span className="text-secondary">{BUDGET_LABELS[budgetRange]}</span>
          </div>
        </div>
        {linked && (
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
            Vérifié
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant font-body">
        {projectDescription}
      </p>

      <div className="mt-6 flex items-center gap-2 pt-4 border-t border-outline-variant/10 text-xs font-medium text-on-surface/60">
        <span className="material-symbols-outlined text-sm">person</span>
        <span>
          {submitterName}, {getCountryName(submitterCountry)}
        </span>
      </div>
    </div>
  );
}
