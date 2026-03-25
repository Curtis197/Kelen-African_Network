import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

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

      <div className="mt-6">
        <RegisterForm />
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
    </>
  );
}
