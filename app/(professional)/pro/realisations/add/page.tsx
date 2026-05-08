import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProjectDocumentForm } from "@/components/forms/RealizationForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajouter une réalisation — Kelen Pro",
  description: "Démontrez votre savoir-faire en ajoutant une nouvelle réalisation Ã  votre portfolio.",
};

export default async function AddRealizationPage() {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
  }

  if (!user) {
    redirect("/pro/connexion");
  }


  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();


  if (profError) {
    if (profError.code === '42501') {
    } else {
    }
  }

  if (!professional) {
    redirect("/pro/profil");
  }


  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-10">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Nouvelle réalisation
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Remplissez les détails pour faire rayonner votre expertise.
        </p>
      </div>

      <div className="rounded-2xl sm:rounded-[2.5rem] bg-white p-5 sm:p-8 shadow-sm lg:p-12">
        <ProjectDocumentForm professionalId={professional.id} />
      </div>
    </div>
  );
}
