"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteProjectDocument(id: string) {
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
    throw new Error("Erreur lors de la suppression.");
  }

  revalidatePath("/pro/realisations");
}

export async function addProjectImage(documentId: string, imageUrls: string[]): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) return { success: false, error: "Profil professionnel non trouvé" };

  // Verify document ownership
  const { data: document } = await supabase
    .from("project_documents")
    .select("id")
    .eq("id", documentId)
    .eq("professional_id", professional.id)
    .single();

  if (!document) return { success: false, error: "Document introuvable" };

  // Check if document already has images to determine order_index
  const { data: existingImages } = await supabase
    .from("project_images")
    .select("id")
    .eq("project_document_id", documentId);

  const startIndex = existingImages?.length || 0;

  // Insert images
  const imageRows = imageUrls.map((url, idx) => ({
    project_document_id: documentId,
    professional_id: professional.id,
    url,
    is_main: startIndex === 0 && idx === 0, // First image ever is main by default
  }));

  const { error } = await supabase
    .from("project_images")
    .insert(imageRows);

  if (error) {
    if (error.code === '42501') {
      return { success: false, error: "Erreur de permissions. Veuillez contacter le support." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/pro/realisations");
  revalidatePath(`/pro/projets/${documentId}/documents`);
  return { success: true };
}

export async function deleteProjectImage(imageId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) return { success: false, error: "Profil professionnel non trouvé" };

  // Verify image ownership
  const { data: image } = await supabase
    .from("project_images")
    .select("id, project_document_id")
    .eq("id", imageId)
    .eq("professional_id", professional.id)
    .single();

  if (!image) return { success: false, error: "Image introuvable" };

  const { error } = await supabase
    .from("project_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    if (error.code === '42501') {
      return { success: false, error: "Erreur de permissions. Veuillez contacter le support." };
    }
    return { success: false, error: error.message };
  }

  // If we deleted the main image and there are other images, set the first one as main
  const { data: remainingImages } = await supabase
    .from("project_images")
    .select("id")
    .eq("project_document_id", image.project_document_id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (remainingImages && remainingImages.length > 0) {
    await supabase
      .from("project_images")
      .update({ is_main: true })
      .eq("id", remainingImages[0].id);
  }

  revalidatePath("/pro/realisations");
  revalidatePath(`/pro/projets/${image.project_document_id}/documents`);
  return { success: true };
}

export async function setMainProjectImage(documentId: string, imageId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) return { success: false, error: "Profil professionnel non trouvé" };

  // Verify document ownership
  const { data: document } = await supabase
    .from("project_documents")
    .select("id")
    .eq("id", documentId)
    .eq("professional_id", professional.id)
    .single();

  if (!document) return { success: false, error: "Document introuvable" };

  // Verify image belongs to this document
  const { data: image } = await supabase
    .from("project_images")
    .select("id")
    .eq("id", imageId)
    .eq("project_document_id", documentId)
    .single();

  if (!image) return { success: false, error: "Image introuvable pour ce document" };

  // Set all images to not main
  const { error: updateError1 } = await supabase
    .from("project_images")
    .update({ is_main: false })
    .eq("project_document_id", documentId);

  if (updateError1) {
    return { success: false, error: updateError1.message };
  }

  // Set selected image as main
  const { error: updateError2 } = await supabase
    .from("project_images")
    .update({ is_main: true })
    .eq("id", imageId)
    .eq("project_document_id", documentId);

  if (updateError2) {
    if (updateError2.code === '42501') {
      return { success: false, error: "Erreur de permissions. Veuillez contacter le support." };
    }
    return { success: false, error: updateError2.message };
  }

  revalidatePath("/pro/realisations");
  revalidatePath(`/pro/projets/${documentId}/documents`);
  return { success: true };
}
