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
    <div className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-sm border-l-4 border-error transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              report
            </span>
            <h4 className="font-headline font-bold text-lg text-on-surface">
              {BREACH_LABELS[breachType]}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-on-surface-variant/70 uppercase tracking-widest">
            {severity && (
              <span className="rounded-full bg-error/10 px-2.5 py-0.5 text-[10px] font-bold text-error border border-error/20">
                {SEVERITY_LABELS[severity]}
              </span>
            )}
            <span className="text-outline-variant/50">·</span>
            <span>Prévu : {formatDate(agreedStartDate)} — {formatDate(agreedEndDate)}</span>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
          Signalé le {formatDate(createdAt)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant font-body">
        {breachDescription}
      </p>

      {(timelineDeviation || budgetDeviation) && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-surface-container-low p-4 text-xs">
          {timelineDeviation && (
            <div>
              <p className="font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Écart délai</p>
              <p className="mt-1 font-semibold text-error">{timelineDeviation}</p>
            </div>
          )}
          {budgetDeviation && (
            <div>
              <p className="font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Écart budget</p>
              <p className="mt-1 font-semibold text-error">{budgetDeviation}</p>
            </div>
          )}
        </div>
      )}

      {/* Professional response */}
      {proResponse && (
        <div className="mt-6 rounded-xl bg-surface-container-low p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/30"></div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/80">
            Réponse du professionnel
            {proRespondedAt && (
              <span className="font-medium normal-case tracking-normal text-on-surface-variant/60">
                {" "}· {formatDate(proRespondedAt)}
              </span>
            )}
          </p>
          <p className="text-sm leading-relaxed text-on-surface font-body italic">
            &quot;{proResponse}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
