import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription — Kelen",
  description:
    "Créez votre compte Kelen pour vérifier des professionnels ou référencer votre entreprise.",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold text-foreground">
        Créer un compte
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Choisissez votre profil pour commencer
      </p>

      {/* Google OAuth Button */}
      <div className="mt-6">
        <GoogleButton role="client" />
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
        <RegisterForm defaultMode="client" allowSwitch={false} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href="/connexion"
          className="font-medium text-kelen-green-600 hover:text-kelen-green-700"
        >
          Se connecter
        </Link>
      </p>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <p className="text-xs text-muted-foreground">
          Vous êtes professionnel ?{" "}
          <Link href="/pro/inscription" className="font-medium text-amber-600 hover:text-amber-700">
            Créer un compte pro
          </Link>
        </p>
      </div>
    </>
  );
}
