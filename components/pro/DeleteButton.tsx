"use client";

import { toast } from "sonner";
import { deleteRealization } from "@/lib/actions/portfolio";

export function DeleteButton({ realizationId }: { realizationId: string }) {
  function handleDelete() {
    toast("Supprimer cette réalisation ?", {
      description: "Elle sera retirée de votre profil public.",
      action: {
        label: "Supprimer",
        onClick: () => deleteRealization(realizationId),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs font-bold text-kelen-red-500 hover:text-kelen-red-600 transition-colors"
    >
      Supprimer
    </button>
  );
}
