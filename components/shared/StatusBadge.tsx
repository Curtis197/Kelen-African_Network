import { STATUS_CONFIG } from "@/lib/utils/constants";
import { formatRating } from "@/lib/utils/format";
import type { ProfessionalStatus } from "@/lib/supabase/types";

interface StatusBadgeProps {
  status: ProfessionalStatus;
  recommendationCount?: number;
  signalCount?: number;
  avgRating?: number | null;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function StatusBadge({
  status,
  recommendationCount = 0,
  signalCount = 0,
  avgRating = null,
  size = "md",
  showDetails = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const detailText = getDetailText(status, recommendationCount, signalCount, avgRating);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bgClass} ${config.borderClass} ${config.textClass} ${sizeClasses[size]}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
      {showDetails && detailText && (
        <span className="opacity-80">· {detailText}</span>
      )}
    </span>
  );
}

function getDetailText(
  status: ProfessionalStatus,
  recCount: number,
  sigCount: number,
  avgRating: number | null
): string {
  switch (status) {
    case "gold":
    case "silver":
      return `${recCount} projet${recCount > 1 ? "s" : ""} vérifié${recCount > 1 ? "s" : ""}${avgRating !== null ? ` · ★ ${formatRating(avgRating)}` : ""}`;
    case "white":
      return "Aucun historique Kelen";
    case "red":
      return `${sigCount} signal${sigCount > 1 ? "s" : ""} documenté${sigCount > 1 ? "s" : ""}`;
    case "black":
      return `${sigCount} signaux documentés`;
  }
}
