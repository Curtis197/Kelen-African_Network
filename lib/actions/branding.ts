"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { z } from "zod";

const brandColorsSchema = z.object({
  primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Couleur primaire invalide (format hex attendu)"),
  secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Couleur secondaire invalide (format hex attendu)"),
  accent: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Couleur d'accent invalide (format hex attendu)"),
});

/**
 * Upload professional logo and store the path.
 * Color extraction happens client-side (colorthief).
 */
export async function uploadLogo(
  file: FormData
): Promise<{ storagePath?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { error: "Professionnel introuvable" };

  const imageFile = file.get("logo") as File;
  if (!imageFile) return { error: "Aucun fichier" };

  // Validate
  if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(imageFile.type)) {
    return { error: "Format non supporté. Utilisez PNG, JPEG, WebP ou SVG." };
  }

  if (imageFile.size > 5 * 1024 * 1024) {
    return { error: "Le logo ne doit pas dépasser 5 Mo." };
  }

  // Upload to Supabase Storage
  const uuid = crypto.randomUUID();
  const ext = imageFile.name.split(".").pop() || "png";
  const storagePath = `logos/${pro.id}/${uuid}.${ext}`;

  const arrayBuffer = await imageFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(storagePath, buffer, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Save path to professionals table
  const { error: dbError } = await supabase
    .from("professionals")
    .update({ logo_storage_path: storagePath })
    .eq("id", pro.id);

  if (dbError) {
    return { error: dbError.message };
  }

  // Delete old logo if exists
  // (handled client-side by tracking old path)

  revalidatePath(`/pro/profil`);
  revalidatePath(`/professionnels/${pro.id}`);

  return { storagePath };
}

/**
 * Save extracted brand colors to professional profile.
 */
export async function saveBrandColors(
  logoStoragePath: string,
  colors: { primary: string; secondary: string; accent: string }
): Promise<{ error?: string }> {
  // Validate colors
  const validation = brandColorsSchema.safeParse(colors);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { error: "Professionnel introuvable" };

  const { error } = await supabase
    .from("professionals")
    .update({
      brand_primary: colors.primary,
      brand_secondary: colors.secondary,
      brand_accent: colors.accent,
    })
    .eq("id", pro.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pro/profil`);
  revalidatePath(`/professionnels/${pro.id}`);

  return {};
}

/**
 * Get signed URL for the professional's logo.
 */
export async function getLogoUrl(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: pro } = await supabase
    .from("professionals")
    .select("logo_storage_path")
    .eq("user_id", user.id)
    .single();

  if (!pro?.logo_storage_path) return null;

  const { data } = await supabase.storage
    .from("logos")
    .createSignedUrl(pro.logo_storage_path, 3600);

  return data?.signedUrl || null;
}
