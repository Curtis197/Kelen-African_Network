"use client";

import { Eye, EyeOff } from "lucide-react";
import { toggleRealizationFeatured } from "@/lib/actions/portfolio";

export function ToggleFeaturedButton({
  realizationId,
  isFeatured,
}: {
  realizationId: string;
  isFeatured: boolean;
}) {
  async function handleToggle() {
    await toggleRealizationFeatured(realizationId, !isFeatured);
  }

  return (
    <button
      onClick={handleToggle}
      title={isFeatured ? "Retirer du portfolio" : "Afficher dans le portfolio"}
      aria-label={isFeatured ? "Retirer du portfolio" : "Afficher dans le portfolio"}
      className={`p-1.5 rounded-lg transition-colors ${
        isFeatured
          ? "text-kelen-green-600 bg-kelen-green-50 hover:bg-kelen-green-100"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
      }`}
    >
      {isFeatured ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
}
