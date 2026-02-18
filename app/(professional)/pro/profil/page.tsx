import type { Metadata } from "next";
import { ProProfileForm } from "@/components/forms/ProProfileForm";

export const metadata: Metadata = {
  title: "Mon profil — Kelen Pro",
};

export default function ProProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>
      <p className="mt-1 text-muted-foreground">
        Modifiez les informations visibles sur votre profil public.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-white p-6">
        <ProProfileForm />
      </div>
    </div>
  );
}
