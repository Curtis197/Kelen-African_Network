"use client";

import { RecommendationForm } from "@/components/forms/RecommendationForm";

export default function ExternalRecommendationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Recommander un professionnel externe
        </h1>
        <p className="mt-3 text-stone-500 font-medium">
          Ce professionnel n'est pas encore sur Kelen. Saisissez ses informations pour l'aider à construire sa réputation.
        </p>
      </header>

      <div className="rounded-[2.5rem] border border-stone-200 bg-white p-8 shadow-sm">
        <RecommendationForm isExternal={true} />
      </div>
    </div>
  );
}
