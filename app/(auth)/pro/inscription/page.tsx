import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const metadata: Metadata = {
  title: "Inscription Pro — Kelen",
  description: "Référencez votre entreprise sur Kelen et boostez votre visibilité.",
};

export default function ProRegisterPage() {
  return (
    <>
      {/* Pro badge */}
      <div className="mb-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/70 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-amber-700">
          <span aria-hidden="true">✦</span>
          Espace Professionnel
        </span>
        <Link
          href="/inscription"
          className="text-xs text-muted-foreground hover:text-kelen-green-600 transition-colors underline-offset-2 hover:underline"
        >
          Espace client
        </Link>
      </div>

      {/* Header */}
      <div className="mb-7">
        <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Devenir Pro Kelen
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Rejoignez le réseau des professionnels de confiance
        </p>
      </div>

      {/* Google OAuth */}
      <GoogleButton role="professional" />

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2.5 text-muted-foreground tracking-wider">
            Ou continuer avec email
          </span>
        </div>
      </div>

      <RegisterForm defaultMode="professional" allowSwitch={false} />

      <div className="mt-6 flex flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte pro ?{" "}
          <Link
            href="/pro/connexion"
            className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </>
  );
}
