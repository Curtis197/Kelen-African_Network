import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { WhatsAppButton } from "@/components/auth/WhatsAppButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription — Kelen",
  description:
    "Créez votre compte Kelen pour vérifier des professionnels ou référencer votre entreprise.",
};

export default function RegisterPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-7">
        <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-kelen-green-50 text-kelen-green-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Créer un compte
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Rejoignez le réseau de confiance Kelen
        </p>
      </div>

      {/* OAuth buttons */}
      <div className="space-y-2.5">
        <GoogleButton role="client" />
        <WhatsAppButton role="client" />
      </div>

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

      <RegisterForm defaultMode="client" allowSwitch={false} />

      <div className="mt-6 flex flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link
            href="/connexion"
            className="font-semibold text-kelen-green-600 hover:text-kelen-green-700 underline-offset-2 hover:underline transition-colors"
          >
            Se connecter
          </Link>
        </p>

        <div className="border-t border-border" />

        <p className="text-center text-xs text-muted-foreground">
          Vous êtes professionnel ?{" "}
          <Link
            href="/pro/inscription"
            className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
          >
            Créer un compte pro ✦
          </Link>
        </p>
      </div>
    </>
  );
}
