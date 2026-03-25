import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — Kelen",
  description: "Connectez-vous à votre compte Kelen.",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold text-foreground">
        Connexion
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Accédez à votre espace Kelen
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="font-medium text-kelen-green-600 hover:text-kelen-green-700"
        >
          Créer un compte
        </Link>
      </p>
    </>
  );
}
