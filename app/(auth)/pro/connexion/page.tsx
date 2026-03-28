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
      <div className="mb-6 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-700">
          <span>✦</span>
          Espace Professionnel
        </span>
      </div>

      <h1 className="text-center text-2xl font-bold text-foreground">
        Connexion Pro
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
          className="font-medium text-amber-600 hover:text-amber-700"
        >
          Créer un compte pro
        </Link>
      </p>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <p className="text-xs text-muted-foreground">
          Vous êtes client ?{" "}
          <Link href="/connexion" className="font-medium text-kelen-green-600 hover:text-kelen-green-700">
            Espace client
          </Link>
        </p>
      </div>
    </>
  );
}
