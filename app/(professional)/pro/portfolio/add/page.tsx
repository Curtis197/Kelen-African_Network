import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RealizationForm } from "@/components/forms/PortfolioForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajouter une réalisation — Kelen Pro",
  description: "Ajoutez une réalisation à votre portfolio public Kelen.",
};

export default async function AddPortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/pro/profil");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Nouvelle réalisation
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Ajoutez un projet terminé à votre portfolio public. Les visiteurs de votre profil verront cette réalisation.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <RealizationForm professionalId={professional.id} />
      </div>
    </div>
  );
}
