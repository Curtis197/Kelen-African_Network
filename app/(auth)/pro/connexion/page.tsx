import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion Pro — Kelen",
  description: "Connectez-vous à votre espace professionnel Kelen.",
};

export default function ProLoginPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold text-foreground">
        Espace Pro
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Accédez à votre tableau de bord professionnel
      </p>

      <div className="mt-6">
        <LoginForm defaultRole="professional" />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore référencé ?{" "}
        <Link
          href="/pro/inscription"
          className="font-medium text-kelen-green-600 hover:text-kelen-green-700"
        >
          Créer un compte pro
        </Link>
      </p>
    </>
  );
}
