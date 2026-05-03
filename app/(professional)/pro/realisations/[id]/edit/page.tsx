import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjectDocumentForm } from "@/components/forms/RealizationForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier la rÃ©alisation â€” Kelen Pro",
};

interface EditRealizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRealizationPage({ params }: EditRealizationPageProps) {
  const { id } = await params;
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


  // Fetch realization from professional_realizations table (NOT project_documents)
  const { data: realization, error: realizationError } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*),
      documents:realization_documents(*)
    `)
    .eq("id", id)
    .eq("professional_id", professional.id)
    .single();


  if (realizationError) {
    if (realizationError.code === '42501') {
    } else {
    }
    notFound();
  }

  if (!realization) {
    notFound();
  }


  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Modifier : {realization.title}
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Mettez Ã  jour les informations et les mÃ©dias de votre rÃ©alisation.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <ProjectDocumentForm
          professionalId={professional.id}
          initialData={realization}
        />
      </div>
    </div>
  );
}
