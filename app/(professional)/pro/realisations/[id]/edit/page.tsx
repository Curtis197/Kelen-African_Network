import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RealizationForm } from "@/components/forms/RealizationForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier la réalisation — Kelen Pro",
};

interface EditRealizationPageProps {
  params: {
    id: string;
  };
}

export default async function EditRealizationPage({ params }: EditRealizationPageProps) {
  const supabase = await createClient();
  const { id } = params;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/pro/profil");

  // Fetch realization with all assets
  const { data: realization } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*),
      documents:realization_documents(*)
    `)
    .eq("id", id)
    .eq("professional_id", professional.id)
    .single();

  if (!realization) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Modifier : {realization.title}
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Mettez à jour les informations et les médias de votre projet.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <RealizationForm 
          professionalId={professional.id} 
          initialData={realization} 
        />
      </div>
    </div>
  );
}
