import type { Metadata } from "next";
import Link from "next/link";
import { PasswordResetForm } from "@/components/forms/PasswordResetForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Kelen",
  description: "Réinitialisez votre mot de passe Kelen.",
};

export default function PasswordResetPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-7">
        <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-kelen-green-50 text-kelen-green-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Mot de passe oublié
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <PasswordResetForm />

      <div className="mt-6 flex flex-col gap-4">
        <div className="border-t border-border" />

        <div className="flex items-center justify-center gap-5 text-sm">
          <Link
            href="/connexion"
            className="font-semibold text-kelen-green-600 hover:text-kelen-green-700 underline-offset-2 hover:underline transition-colors"
          >
            Espace client
          </Link>
          <span className="text-border select-none">·</span>
          <Link
            href="/pro/connexion"
            className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
          >
            Espace Pro ✦
          </Link>
        </div>
      </div>
    </>
  );
}
