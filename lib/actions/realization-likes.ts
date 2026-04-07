"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleRealizationLike(realizationId: string): Promise<{ liked: boolean; count: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Vous devez être connecté");

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("realization_likes")
    .select("id")
    .eq("realization_id", realizationId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    // Unlike
    await supabase
      .from("realization_likes")
      .delete()
      .eq("id", existingLike.id);
    
    const { count } = await supabase
      .from("realization_likes")
      .select("*", { count: "exact", head: true })
      .eq("realization_id", realizationId);
    
    return { liked: false, count: count || 0 };
  } else {
    // Like
    await supabase
      .from("realization_likes")
      .insert({ realization_id: realizationId, user_id: user.id });
    
    const { count } = await supabase
      .from("realization_likes")
      .select("*", { count: "exact", head: true })
      .eq("realization_id", realizationId);
    
    return { liked: true, count: count || 0 };
  }
}

export async function getRealizationLikeStatus(realizationId: string): Promise<{ liked: boolean; count: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get count
  const { count } = await supabase
    .from("realization_likes")
    .select("*", { count: "exact", head: true })
    .eq("realization_id", realizationId);

  // Check if user liked
  let liked = false;
  if (user) {
    const { data: like } = await supabase
      .from("realization_likes")
      .select("id")
      .eq("realization_id", realizationId)
      .eq("user_id", user.id)
      .single();
    
    liked = !!like;
  }

  return { liked, count: count || 0 };
}
