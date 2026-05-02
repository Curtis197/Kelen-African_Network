import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { WhatsAppButton } from "@/components/auth/WhatsAppButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion Pro — Kelen",
  description: "Connectez-vous à votre espace professionnel Kelen.",
};

export default function ProLoginPage() {
  return (
    <>
      {/* Pro badge */}
      <div className="mb-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/70 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-amber-700">
          <span aria-hidden="true">✦</span>
          Espace Professionnel
        </span>
        <Link
          href="/connexion"
          className="text-xs text-muted-foreground hover:text-kelen-green-600 transition-colors underline-offset-2 hover:underline"
        >
          Espace client
        </Link>
      </div>

      {/* Header */}
      <div className="mb-7">
        <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Connexion Pro
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Accédez à votre tableau de bord professionnel
        </p>
      </div>

      {/* OAuth buttons */}
      <div className="mb-5 space-y-2.5">
        <GoogleButton role="professional" />
        <WhatsAppButton role="professional" />
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

      <LoginForm defaultRole="professional" />

      <div className="mt-6 flex flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Pas encore référencé ?{" "}
          <Link
            href="/pro/inscription"
            className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
          >
            Créer un compte pro
          </Link>
        </p>
      </div>
    </>
  );
}
