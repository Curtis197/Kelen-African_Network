import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription Pro — Kelen",
  description: "Référencez votre entreprise sur Kelen et boostez votre visibilité.",
};

export default function ProRegisterPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-700">
          <span>✦</span>
          Espace Professionnel
        </span>
      </div>

      <h1 className="text-center text-2xl font-bold text-foreground">
        Devenir Pro Kelen
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Rejoignez le réseau des professionnels de confiance
      </p>

      {/* Google OAuth Button */}
      <div className="mt-6">
        <GoogleButton role="professional" />
      </div>

      {/* Divider */}
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec email
          </span>
        </div>
      </div>

      <div className="mt-6">
        <RegisterForm defaultMode="professional" allowSwitch={false} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte pro ?{" "}
        <Link
          href="/pro/connexion"
          className="font-medium text-amber-600 hover:text-amber-700"
        >
          Se connecter
        </Link>
      </p>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <p className="text-xs text-muted-foreground">
          Vous êtes client ?{" "}
          <Link href="/inscription" className="font-medium text-kelen-green-600 hover:text-kelen-green-700">
            Créer un compte client
          </Link>
        </p>
      </div>
    </>
  );
}
