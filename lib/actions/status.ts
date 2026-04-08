"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Manually recalculate a professional's status.
 * Useful for admin override or after bulk data changes.
 *
 * Calls the database function compute_professional_status(prof_id)
 * which is a SECURITY DEFINER function (runs with elevated privileges).
 */
export async function recalculateStatus(professionalId: string): Promise<{
  oldStatus: string | null;
  newStatus: string | null;
  recommendationCount: number;
  signalCount: number;
  error?: string;
}> {
  const supabase = await createClient();

  // Get current status before recalculation
  const { data: pro } = await supabase
    .from("professionals")
    .select("status, recommendation_count, signal_count")
    .eq("id", professionalId)
    .single();

  if (!pro) {
    return {
      oldStatus: null,
      newStatus: null,
      recommendationCount: 0,
      signalCount: 0,
      error: "Professionnel introuvable",
    };
  }

  // Call the database function
  const { error } = await supabase.rpc("compute_professional_status", {
    prof_id: professionalId,
  });

  if (error) {
    return {
      oldStatus: pro.status,
      newStatus: null,
      recommendationCount: pro.recommendation_count || 0,
      signalCount: pro.signal_count || 0,
      error: error.message,
    };
  }

  // Fetch updated status
  const { data: updated } = await supabase
    .from("professionals")
    .select("status, recommendation_count, signal_count")
    .eq("id", professionalId)
    .single();

  revalidatePath(`/pro/dashboard`);
  revalidatePath(`/professionnels/${pro.slug}`);

  return {
    oldStatus: pro.status,
    newStatus: updated?.status || null,
    recommendationCount: updated?.recommendation_count || 0,
    signalCount: updated?.signal_count || 0,
  };
}

/**
 * Admin-only: force set a professional's status (e.g., forgive Red status).
 */
export async function forceSetStatus(
  professionalId: string,
  status: "gold" | "silver" | "white" | "red" | "black"
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  // Verify admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Accès refusé. Réservé aux administrateurs." };
  }

  const { error } = await supabase
    .from("professionals")
    .update({ status })
    .eq("id", professionalId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
