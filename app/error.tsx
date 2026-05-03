"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 py-16">
        <div className="text-5xl font-headline font-black text-stone-200">500</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold font-headline text-stone-900">
            Une erreur est survenue
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Quelque chose s&apos;est mal passé. Nos équipes ont été notifiées.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-kelen-green-600 text-white rounded-xl text-sm font-semibold hover:bg-kelen-green-700 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-stone-200 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-100 transition-colors"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
