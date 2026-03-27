"use client";

import { SignalForm } from "@/components/forms/SignalForm";

export default function ExternalSignalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 text-center text-red-600">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Signaler un professionnel externe
        </h1>
        <p className="mt-3 text-stone-500 font-medium whitespace-pre-wrap">
          Le professionnel n&apos;est pas encore sur Kelen. Saisissez ses informations pour documenter son manquement contractuel.
        </p>
      </header>

      <div className="rounded-[2.5rem] border border-red-100 bg-white p-8 shadow-sm">
        <SignalForm isExternal={true} />
      </div>
    </div>
  );
}
