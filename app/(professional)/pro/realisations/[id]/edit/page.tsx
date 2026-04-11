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
  console.log("[EditRealizationPage] Loading realization for edit:", (await params).id);
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  console.log("[EditRealizationPage] Checking authentication...");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("[EditRealizationPage] Auth result:", {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (authError) {
    console.error("[EditRealizationPage] Auth error:", authError);
  }

  if (!user) {
    console.warn("[EditRealizationPage] No user session - redirecting to login");
    redirect("/login");
  }

  console.log("[EditRealizationPage] ✅ Authentication successful");

  // Fetch professional profile
  console.log("[EditRealizationPage] Fetching professional profile...");
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  console.log("[EditRealizationPage] Professional query result:", {
    success: !profError,
    hasData: !!professional,
    professionalId: professional?.id,
    errorMessage: profError?.message,
    errorCode: profError?.code
  });

  if (profError) {
    if (profError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professionals table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', profError.message);
      console.error('[RLS] Fix: Check RLS policies on professionals table');
      console.error('[RLS] ========================================');
    } else {
      console.error("[EditRealizationPage] Professional fetch error:", profError);
    }
  }

  if (!professional) {
    console.warn("[EditRealizationPage] No professional profile found - redirecting to profil");
    redirect("/pro/profil");
  }

  console.log("[EditRealizationPage] ✅ Professional found:", professional.id);

  // Fetch realization from professional_realizations table (NOT project_documents)
  console.log("[EditRealizationPage] Fetching realization from professional_realizations...");
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

  console.log("[EditRealizationPage] Realization query result:", {
    success: !realizationError,
    hasData: !!realization,
    realizationId: realization?.id,
    title: realization?.title,
    errorMessage: realizationError?.message,
    errorCode: realizationError?.code
  });

  if (realizationError) {
    if (realizationError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professional_realizations table');
      console.error('[RLS] ========================================');
      console.error('[RLS] Realization ID:', id);
      console.error('[RLS] Professional ID:', professional.id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', realizationError.message);
      console.error('[RLS] Fix: Check RLS policies on professional_realizations table');
      console.error('[RLS] ========================================');
    } else {
      console.error("[EditRealizationPage] Realization fetch error:", realizationError);
    }
    notFound();
  }

  if (!realization) {
    console.warn("[EditRealizationPage] Realization not found");
    notFound();
  }

  console.log("[EditRealizationPage] ✅ Realization found:", realization.title);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Modifier : {realization.title}
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Mettez à jour les informations et les médias de votre réalisation.
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
