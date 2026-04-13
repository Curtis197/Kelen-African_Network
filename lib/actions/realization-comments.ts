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
    console.error("Error creating comment:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getRealizationComments(realizationId: string): Promise<Array<any>> {
  console.log('[COMMENTS] Fetching comments for realization:', realizationId);
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

  console.log('[COMMENTS] Result:', { count: data?.length || 0, error: error?.message, code: error?.code });

  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on realization_comments!');
    console.error('[RLS] Table: realization_comments');
    console.error('[RLS] Realization ID:', realizationId);
    console.error('[RLS] Fix: Add RLS policy allowing SELECT for approved comments');
  }

  if (!error && data?.length === 0) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING on realization_comments!');
    console.warn('[RLS] Query succeeded but 0 rows - RLS may be filtering');
    console.warn('[RLS] Realization ID:', realizationId);
  }

  if (error) {
    console.error("Error fetching comments:", error);
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
    console.error("Error moderating comment:", error);
    return { success: false };
  }

  return { success: true };
}
