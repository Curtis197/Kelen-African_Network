import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/forms/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Réinitialisation du mot de passe — Kelen",
  description: "Définissez votre nouveau mot de passe Kelen.",
};

export default function PasswordResetConfirmPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold text-foreground">
        Nouveau mot de passe
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Veuillez choisir un mot de passe sécurisé pour votre compte
      </p>

      <div className="mt-6">
        <UpdatePasswordForm />
      </div>
    </>
  );
}
