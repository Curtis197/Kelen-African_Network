import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProjectDocumentForm } from "@/components/forms/RealizationForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ajouter une réalisation — Kelen Pro",
  description: "Démontrez votre savoir-faire en ajoutant une nouvelle réalisation à votre portfolio.",
};

export default async function AddRealizationPage() {
  console.log("[AddRealizationPage] Loading add realization page");
  const supabase = await createClient();

  // Auth check
  console.log("[AddRealizationPage] Checking authentication...");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("[AddRealizationPage] Auth result:", {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (authError) {
    console.error("[AddRealizationPage] Auth error:", authError);
  }

  if (!user) {
    console.warn("[AddRealizationPage] No user session - redirecting to login");
    redirect("/login");
  }

  console.log("[AddRealizationPage] ✅ Authentication successful");

  // Fetch professional profile
  console.log("[AddRealizationPage] Fetching professional profile...");
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  console.log("[AddRealizationPage] Professional query result:", {
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
      console.error("[AddRealizationPage] Professional fetch error:", profError);
    }
  }

  if (!professional) {
    console.warn("[AddRealizationPage] No professional profile found - redirecting to profil");
    redirect("/pro/profil");
  }

  console.log("[AddRealizationPage] ✅ Professional found:", professional.id);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Nouvelle réalisation
        </h1>
        <p className="mt-2 text-on-surface-variant/70">
          Remplissez les détails pour faire rayonner votre expertise.
        </p>
      </div>

      <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
        <ProjectDocumentForm professionalId={professional.id} />
      </div>
    </div>
  );
}
