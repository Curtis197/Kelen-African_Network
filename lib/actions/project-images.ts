"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  is_main: boolean;
  created_at: string;
}

export async function getProjectImages(projectId: string): Promise<ProjectImage[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return (data || []) as ProjectImage[];
}

export async function getAllProjectsMainImages(projectIds: string[]): Promise<Record<string, string>> {
  if (projectIds.length === 0) return {};

  const supabase = await createClient();

  // Try to get main images first
  const { data, error } = await supabase
    .from("user_project_images")
    .select("project_id, url, is_main")
    .in("project_id", projectIds);

  if (error) {
    return {};
  }

  const imagesMap: Record<string, string> = {};
  // Sort or process to ensure we pick is_main if it exists, otherwise any image
  (data || []).forEach(img => {
    // If it's main, it always wins. If we don't have an image for this project yet, take this one.
    if (img.is_main || !imagesMap[img.project_id]) {
      imagesMap[img.project_id] = img.url;
    }
  });

  return imagesMap;
}

export async function uploadProjectImage(projectId: string, imageUrl: string): Promise<{ success: boolean; image?: ProjectImage; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return { success: false, error: "Projet non trouvé ou non autorisé" };
  }

  // Check if this is the first image - make it main
  const { count: existingCount } = await supabase
    .from("user_project_images")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const isFirstImage = !existingCount || existingCount === 0;

  const { data, error } = await supabase
    .from("user_project_images")
    .insert({
      project_id: projectId,
      url: imageUrl,
      is_main: isFirstImage,
    })
    .select()
    .single();

  if (error?.code === '42501') {
    return { success: false, error: "Non autorisé - RLS bloque l'insertion" };
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true, image: data as ProjectImage };
}

export async function deleteProjectImage(imageId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // First, verify the image exists and get its project_id
  const { data: image, error: fetchError } = await supabase
    .from("user_project_images")
    .select("id, project_id")
    .eq("id", imageId)
    .single();

  if (fetchError?.code === '42501') {
    return { success: false, error: "Non autorisé - RLS bloque la lecture" };
  }

  if (fetchError || !image) {
    return { success: false, error: "Image non trouvée" };
  }

  // Verify the image belongs to the specified project
  if (image.project_id !== projectId) {
    return { success: false, error: "Image ne correspond pas au projet" };
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return { success: false, error: "Non autorisé - projet non possédé" };
  }

  const { error: deleteError } = await supabase
    .from("user_project_images")
    .delete()
    .eq("id", imageId);

  if (deleteError?.code === '42501') {
    return { success: false, error: "Non autorisé - RLS bloque la suppression" };
  }

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true };
}

export async function setMainProjectImage(imageId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // First, verify the image exists and belongs to the project
  const { data: image, error: fetchError } = await supabase
    .from("user_project_images")
    .select("id, project_id")
    .eq("id", imageId)
    .single();

  if (fetchError?.code === '42501') {
    return { success: false, error: "Non autorisé - RLS bloque la lecture" };
  }

  if (fetchError || !image) {
    return { success: false, error: "Image non trouvée" };
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return { success: false, error: "Non autorisé - projet non possédé" };
  }

  // Verify image belongs to the project
  if (image.project_id !== projectId) {
    return { success: false, error: "Image ne correspond pas au projet" };
  }

  // Reset all is_main to false for this project
  const { error: resetError } = await supabase
    .from("user_project_images")
    .update({ is_main: false, updated_at: new Date().toISOString() })
    .eq("project_id", projectId);

  if (resetError?.code === '42501') {
    return { success: false, error: "Non autorisé - RLS bloque la mise à jour" };
  }

  if (resetError) {
    return { success: false, error: resetError.message };
  }

  // Set the selected image as main
  const { error: updateError } = await supabase
    .from("user_project_images")
    .update({ is_main: true, updated_at: new Date().toISOString() })
    .eq("id", imageId);

  if (updateError?.code === '42501') {
    return { success: false, error: "Non autorisé - RLS bloque la mise à jour" };
  }

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true };
}
