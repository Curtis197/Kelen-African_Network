import { formatDate } from "@/lib/utils/format";
import type { BreachType } from "@/lib/supabase/types";

interface SignalCardProps {
  breachType: BreachType;
  breachDescription: string;
  severity?: "minor" | "major" | "critical" | null;
  agreedStartDate: string;
  agreedEndDate: string;
  timelineDeviation?: string | null;
  budgetDeviation?: string | null;
  proResponse?: string | null;
  proRespondedAt?: string | null;
  createdAt: string;
}

const BREACH_LABELS: Record<BreachType, string> = {
  timeline: "Non-respect des délais",
  budget: "Dépassement budgétaire",
  quality: "Qualité insuffisante",
  abandonment: "Abandon de chantier",
  fraud: "Autre manquement grave",
};

const SEVERITY_LABELS: Record<string, string> = {
  minor: "Mineur",
  major: "Majeur",
  critical: "Critique",
};

export function SignalCard({
  breachType,
  breachDescription,
  severity,
  agreedStartDate,
  agreedEndDate,
  timelineDeviation,
  budgetDeviation,
  proResponse,
  proRespondedAt,
  createdAt,
}: SignalCardProps) {
  return (
    <div className="rounded-xl border border-kelen-red-500/20 bg-kelen-red-50/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-kelen-red-500">⚠</span>
            <h4 className="font-semibold text-foreground">
              {BREACH_LABELS[breachType]}
            </h4>
            {severity && (
              <span className="rounded-full bg-kelen-red-100 px-2 py-0.5 text-xs font-medium text-kelen-red-700">
                {SEVERITY_LABELS[severity]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Période prévue : {formatDate(agreedStartDate)} — {formatDate(agreedEndDate)}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          Signalé le {formatDate(createdAt)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        {breachDescription}
      </p>

      {timelineDeviation && (
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium">Écart de délai :</span> {timelineDeviation}
        </p>
      )}

      {budgetDeviation && (
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium">Écart budgétaire :</span> {budgetDeviation}
        </p>
      )}

      {/* Professional response */}
      {proResponse && (
        <div className="mt-4 rounded-lg border border-border bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Réponse du professionnel
            {proRespondedAt && (
              <span className="font-normal"> · {formatDate(proRespondedAt)}</span>
            )}
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {proResponse}
          </p>
        </div>
      )}
    </div>
  );
}
