"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <h2 className="text-xl font-extrabold text-stone-900">Erreur admin</h2>
        <p className="text-stone-500 text-sm">
          {error.message || "Une erreur inattendue s'est produite."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-kelen-green-600 text-white rounded-lg text-sm font-semibold hover:bg-kelen-green-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
