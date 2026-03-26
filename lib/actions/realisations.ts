"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteRealization(id: string) {
  const supabase = await createClient();
  
  // 1. Get current auth user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // 2. Verified that the realization belongs to this professional
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) throw new Error("Profil professionnel non trouvé");

  // 3. Delete related images and documents ( Supabase handles cascading if DB is configured, but let's be safe if needed )
  // Actually, standard Supabase with 'ON DELETE CASCADE' is preferred.
  // We should also delete files from storage.
  
  // For now, let's delete the record. RLS will prevent deleting others' records.
  const { error } = await supabase
    .from("professional_realizations")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id);

  if (error) {
    console.error("Error deleting realization:", error);
    throw new Error("Erreur lors de la suppression.");
  }

  revalidatePath("/pro/realisations");
}
