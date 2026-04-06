import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjectDocumentForm } from "@/components/forms/RealizationForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier la réalisation — Kelen Pro",
};

interface EditRealizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRealizationPage({ params }: EditRealizationPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/pro/profil");

  const { data: document } = await supabase
    .from("project_documents")
    .select("*")
    .eq("id", id)
    .eq("professional_id", professional.id)
    .single();

  if (!document) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Modifier : {document.project_title}
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Mettez à jour les informations et les médias de votre projet.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <ProjectDocumentForm 
          professionalId={professional.id} 
          initialData={document} 
        />
      </div>
    </div>
  );
}
