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
      <h1 className="text-center text-2xl font-bold text-foreground">
        Mot de passe oublié
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Entrez votre adresse email pour recevoir un lien de réinitialisation
      </p>

      <div className="mt-6">
        <PasswordResetForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/connexion"
          className="font-medium text-kelen-green-600 hover:text-kelen-green-700"
        >
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
