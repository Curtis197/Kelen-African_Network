import { notFound, redirect } from "next/navigation";
import { RealizationForm } from "@/components/forms/PortfolioForm";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRealizationPage({ params }: Props) {
  const { id } = await params;
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
          Modifier la réalisation
        </h1>
        <p className="mt-2 text-on-surface-variant/70">{realization.title}</p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <RealizationForm
          professionalId={professional.id}
          initialData={{
            id: realization.id,
            title: realization.title,
            description: realization.description,
            location: realization.location,
            completion_date: realization.completion_date
              ? new Date(realization.completion_date).toISOString().split("T")[0]
              : null,
            price: realization.price,
            currency: realization.currency || "XOF",
            images: realization.images || [],
            documents: realization.documents || [],
          }}
        />
      </div>
    </div>
  );
}
