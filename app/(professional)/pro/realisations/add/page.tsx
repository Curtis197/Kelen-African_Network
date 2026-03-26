import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RealizationForm } from "@/components/forms/RealizationForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajouter une réalisation — Kelen Pro",
  description: "Démontrez votre savoir-faire en ajoutant un nouveau projet à votre portfolio.",
};

export default async function AddRealizationPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
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
          Nouveau projet
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Remplissez les détails pour faire rayonner votre expertise.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <RealizationForm professionalId={professional.id} />
      </div>
    </div>
  );
}
