import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription Pro — Kelen",
  description: "Référencez votre entreprise sur Kelen et boostez votre visibilité.",
};

export default function ProRegisterPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold text-foreground">
        Devenir Pro Kelen
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Rejoignez le réseau des professionnels de confiance
      </p>

      <div className="mt-6">
        <RegisterForm defaultMode="professional" allowSwitch={false} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte pro ?{" "}
        <Link
          href="/pro/connexion"
          className="font-medium text-kelen-green-600 hover:text-kelen-green-700"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}
