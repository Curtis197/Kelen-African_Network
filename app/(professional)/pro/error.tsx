"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Pro Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="text-4xl font-headline font-black text-stone-200">Oops</div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-stone-900">Erreur inattendue</h2>
          <p className="text-stone-500 text-sm">
            Cette page a rencontré un problème. Vos données sont en sécurité.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-kelen-green-600 text-white rounded-lg text-sm font-semibold hover:bg-kelen-green-700 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/pro/dashboard"
            className="px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-sm hover:bg-stone-100 transition-colors"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
