import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { WhatsAppButton } from "@/components/auth/WhatsAppButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion — Kelen",
  description: "Connectez-vous à votre compte Kelen.",
};

export default function LoginPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-7">
        <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-kelen-green-50 text-kelen-green-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Connexion
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Accédez à votre espace Kelen
        </p>
      </div>

      {/* OAuth buttons */}
      <div className="mb-5 space-y-2.5">
        <GoogleButton role="client" />
        <WhatsAppButton role="client" />
      </div>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2.5 text-muted-foreground tracking-wider">
            Ou continuer avec email
          </span>
        </div>
      </div>

      <LoginForm defaultRole="client" />

      <div className="mt-6 flex flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="font-semibold text-kelen-green-600 hover:text-kelen-green-700 underline-offset-2 hover:underline transition-colors"
          >
            Créer un compte
          </Link>
        </p>

        <div className="border-t border-border" />

        <p className="text-center text-xs text-muted-foreground">
          Vous êtes professionnel ?{" "}
          <Link
            href="/pro/connexion"
            className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
          >
            Espace Pro ✦
          </Link>
        </p>
      </div>
    </>
  );
}
