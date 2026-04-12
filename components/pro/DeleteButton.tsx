"use client";

import { deleteRealization } from "@/lib/actions/portfolio";

export function DeleteButton({ realizationId }: { realizationId: string }) {
  async function handleDelete() {
    if (!confirm("Supprimer cette réalisation ? Elle sera retirée de votre profil public.")) {
      return;
    }
    await deleteRealization(realizationId);
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
