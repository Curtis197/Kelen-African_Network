"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteProjectDocument(id: string) {
  console.log("[deleteProjectDocument] Deleting:", id);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) throw new Error("Profil professionnel non trouvé");

  const { error } = await supabase
    .from("project_documents")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id);

  if (error) {
    console.error("[deleteProjectDocument] Error:", error);
    throw new Error("Erreur lors de la suppression.");
  }

  revalidatePath("/pro/realisations");
}
