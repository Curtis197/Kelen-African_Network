"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";

interface Props {
  /** Single realization export */
  realizationId?: string;
  /** Full portfolio export */
  professionalId?: string;
  label?: string;
  variant?: "icon" | "full";
}

export function PortfolioPDFButton({ realizationId, professionalId, label, variant = "full" }: Props) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    const url = realizationId
      ? `/api/portfolio-pdf?id=${realizationId}`
      : `/api/portfolio-pdf?professional_id=${professionalId}`;

    setLoading(true);
    const win = window.open(url, "_blank");
    if (!win) {
      toast.error("Pop-up bloqué. Autorisez les pop-ups pour exporter le PDF.");
    }
    // Reset after a short delay (print dialog takes over in the new tab)
    setTimeout(() => setLoading(false), 2000);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title="Exporter en PDF"
        className="flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant/60 hover:text-kelen-green-600 hover:bg-kelen-green-50 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-outline-variant/40 px-5 font-headline text-sm font-bold text-on-surface-variant transition-all hover:border-kelen-green-600 hover:text-kelen-green-600 hover:bg-kelen-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {label ?? "Exporter PDF"}
    </button>
  );
}
