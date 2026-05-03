"use server";

import { createClient } from "@/lib/supabase/server";

export async function createRealizationComment(realizationId: string, content: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Vous devez être connecté");
  if (!content.trim()) return { success: false, error: "Le commentaire ne peut pas être vide" };
  if (content.length < 10) return { success: false, error: "Le commentaire doit contenir au moins 10 caractères" };

  const { error } = await supabase
    .from("realization_comments")
    .insert({
      realization_id: realizationId,
      user_id: user.id,
      content: content.trim(),
      status: "pending" // Requires professional moderation
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getRealizationComments(realizationId: string): Promise<Array<any>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("realization_comments")
    .select(`
      *,
      author:users(display_name, country)
    `)
    .eq("realization_id", realizationId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });


  if (error?.code === '42501') {
  }

  if (!error && data?.length === 0) {
  }

  if (error) {
    return [];
  }

  return data || [];
}

export async function moderateRealizationComment(commentId: string, status: "approved" | "rejected"): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Vous devez être connecté");

  // Verify user owns the realization
  const { data: comment } = await supabase
    .from("realization_comments")
    .select(`
      realization_id,
      professional_realizations!inner(
        professional:professionals(user_id)
      )
    `)
    .eq("id", commentId)
    .single();

  const proUserId = (comment as any)?.realization_id?.professional?.user_id;
  if (proUserId !== user.id) throw new Error("Non autorisé");

  const { error } = await supabase
    .from("realization_comments")
    .update({ status })
    .eq("id", commentId);

  if (error) {
    return { success: false };
  }

  return { success: true };
}
