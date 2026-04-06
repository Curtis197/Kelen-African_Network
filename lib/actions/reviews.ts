// lib/actions/reviews.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const insertReviewSchema = z.object({
  professional_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

export async function submitReview(
  payload: z.infer<typeof insertReviewSchema>
): Promise<ReviewActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Vous devez être connecté pour laisser un avis." };
  }

  const parsed = insertReviewSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Données invalides." };
  }

  const { professional_id, rating, comment } = parsed.data;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("display_name, country")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Impossible de récupérer votre profil." };
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    professional_id,
    reviewer_id: user.id,
    reviewer_name: profile.display_name,
    reviewer_country: profile.country,
    rating,
    comment,
    is_hidden: false,
  });

  if (insertError) {
    console.error("Review insert error:", insertError);
    return { success: false, error: "Une erreur est survenue lors de l'envoi. Veuillez réessayer." };
  }

  return { success: true };
}
