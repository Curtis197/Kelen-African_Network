import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServiceForm } from "@/components/forms/ServiceForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Modifier le service â€” Kelen Pro",
};

interface EditServicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
  }

  if (!user) {
    redirect("/login");
  }

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profError) {
  }

  if (!professional) {
    redirect("/pro/profil");
  }

  // Fetch the service with images, verify ownership
  const { data: service, error: serviceError } = await supabase
    .from("professional_services")
    .select("*, service_images(*)")
    .eq("id", id)
    .eq("professional_id", professional.id)
    .single();

  if (serviceError) {
    notFound();
  }

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Modifier : {service.title}
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Mettez Ã  jour les informations et les mÃ©dias de votre service.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <ServiceForm professionalId={professional.id} initialData={service} />
      </div>
    </div>
  );
}
