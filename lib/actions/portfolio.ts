"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createRealization(data: {
  professional_id: string;
  title: string;
  description: string | null;
  location: string | null;
  completion_date: string | null;
  price: number | null;
  currency: string;
  image_urls: string[];
  document_files?: { url: string; title: string | null; type: string | null }[];
}) {
  console.log("[createRealization] Creating:", data.title);
  const supabase = await createClient();

  const { data: realization, error: insertError } = await supabase
    .from("professional_realizations")
    .insert({
      professional_id: data.professional_id,
      title: data.title,
      description: data.description,
      location: data.location,
      completion_date: data.completion_date,
      price: data.price,
      currency: data.currency,
    })
    .select()
    .single();

  if (insertError || !realization) {
    console.error("[createRealization] Insert error:", insertError);
    throw new Error("Erreur lors de la création de la réalisation");
  }

  // Insert images
  if (data.image_urls.length > 0) {
    const imageRows = data.image_urls.map((url, idx) => ({
      realization_id: realization.id,
      url,
      is_main: idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("realization_images")
      .insert(imageRows);

    if (imgError) {
      console.error("[createRealization] Image insert error:", imgError);
    }
  }

  // Insert document files (optional)
  if (data.document_files && data.document_files.length > 0) {
    const docRows = data.document_files.map((f) => ({
      realization_id: realization.id,
      url: f.url,
      title: f.title,
      type: f.type,
    }));

    const { error: docError } = await supabase
      .from("realization_documents")
      .insert(docRows);

    if (docError) {
      console.error("[createRealization] Document insert error:", docError);
    }
  }

  revalidatePath("/pro/portfolio");
  revalidatePath("/pro/portfolio/add");
  return realization;
}

export async function updateRealization(id: string, data: {
  title: string;
  description: string | null;
  location: string | null;
  completion_date: string | null;
  price: number | null;
  currency: string;
  image_urls?: string[];
  document_files?: { url: string; title: string | null; type: string | null }[];
  removed_image_ids?: string[];
  removed_document_ids?: string[];
}) {
  console.log("[updateRealization] Updating:", id);
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("professional_realizations")
    .update({
      title: data.title,
      description: data.description,
      location: data.location,
      completion_date: data.completion_date,
      price: data.price,
      currency: data.currency,
    })
    .eq("id", id);

  if (updateError) {
    console.error("[updateRealization] Update error:", updateError);
    throw new Error("Erreur lors de la modification");
  }

  // Remove deleted images
  if (data.removed_image_ids && data.removed_image_ids.length > 0) {
    await supabase
      .from("realization_images")
      .delete()
      .in("id", data.removed_image_ids);
  }

  // Add new images
  if (data.image_urls && data.image_urls.length > 0) {
    const hasMain = await supabase
      .from("realization_images")
      .select("id")
      .eq("realization_id", id)
      .eq("is_main", true)
      .maybeSingle();

    const imageRows = data.image_urls.map((url, idx) => ({
      realization_id: id,
      url,
      is_main: !hasMain && idx === 0,
    }));

    await supabase.from("realization_images").insert(imageRows);
  }

  // Remove deleted documents
  if (data.removed_document_ids && data.removed_document_ids.length > 0) {
    await supabase
      .from("realization_documents")
      .delete()
      .in("id", data.removed_document_ids);
  }

  // Add new documents
  if (data.document_files && data.document_files.length > 0) {
    const docRows = data.document_files.map((f) => ({
      realization_id: id,
      url: f.url,
      title: f.title,
      type: f.type,
    }));

    await supabase.from("realization_documents").insert(docRows);
  }

  revalidatePath("/pro/portfolio");
  revalidatePath(`/pro/portfolio/${id}`);
  revalidatePath(`/pro/portfolio/${id}/edit`);
}

export async function deleteRealization(id: string) {
  console.log("[deleteRealization] Deleting:", id);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Verify ownership
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) throw new Error("Profil professionnel non trouvé");

  const { error } = await supabase
    .from("professional_realizations")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id);

  if (error) {
    console.error("[deleteRealization] Error:", error);
    throw new Error("Erreur lors de la suppression");
  }

  revalidatePath("/pro/portfolio");
}
