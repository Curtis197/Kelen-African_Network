"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

interface Props {
  professionalId: string;
  label?: string;
}

export function CataloguePDFButton({ professionalId, label = "Exporter catalogue PDF" }: Props) {
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    const win = window.open(`/api/catalogue-pdf?professional_id=${professionalId}`, "_blank");
    if (!win) {
      alert("Pop-up bloqué. Autorisez les pop-ups pour exporter le PDF.");
    }
    setTimeout(() => setLoading(false), 2000);
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
      {label}
    </button>
  );
}
