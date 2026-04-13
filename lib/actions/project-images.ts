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
  console.log('[PROJECT_IMAGES] Fetching images for project:', projectId);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  console.log('[PROJECT_IMAGES] Auth user:', user?.id);
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  console.log('[PROJECT_IMAGES] Result:', { count: data?.length || 0, error: error?.message, code: error?.code });

  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_project_images!');
    console.error('[RLS] Table: user_project_images');
    console.error('[RLS] Project ID:', projectId);
    console.error('[RLS] User ID:', user.id);
    console.error('[RLS] Fix: Check SELECT policy on user_project_images - should allow WHERE project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())');
  }

  if (!error && data?.length === 0) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING on user_project_images!');
    console.warn('[RLS] Query succeeded but 0 rows - RLS may be filtering');
    console.warn('[RLS] Project ID:', projectId);
  }

  if (error) {
    console.error("Error fetching project images:", error);
    return [];
  }

  return (data || []) as ProjectImage[];
}

export async function uploadProjectImage(projectId: string, imageUrl: string): Promise<{ success: boolean; image?: ProjectImage; error?: string }> {
  console.log('[PROJECT_IMAGES] Adding image for project:', projectId, 'URL:', imageUrl);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  console.log('[PROJECT_IMAGES] Auth user:', user?.id);
  if (!user) return { success: false, error: "Non authentifié" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    console.error('[PROJECT_IMAGES] Project not found or not owned by user:', projectId);
    return { success: false, error: "Projet non trouvé ou non autorisé" };
  }

  // Check if this is the first image - make it main
  const { count: existingCount } = await supabase
    .from("user_project_images")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const isFirstImage = !existingCount || existingCount === 0;
  console.log('[PROJECT_IMAGES] Is first image:', isFirstImage);

  const { data, error } = await supabase
    .from("user_project_images")
    .insert({
      project_id: projectId,
      url: imageUrl,
      is_main: isFirstImage,
    })
    .select()
    .single();

  console.log('[PROJECT_IMAGES] Insert result:', { error: error?.message, code: error?.code });

  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_project_images INSERT!');
    console.error('[RLS] Table: user_project_images');
    console.error('[RLS] Project ID:', projectId);
    console.error('[RLS] User ID:', user.id);
    console.error('[RLS] Fix: Add INSERT policy allowing project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())');
  }

  if (error) {
    console.error("Error adding project image:", error);
    return { success: false, error: error.message };
  }

  console.log('[PROJECT_IMAGES] Image added successfully:', data.id);
  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true, image: data as ProjectImage };
}

export async function deleteProjectImage(imageId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[PROJECT_IMAGES] Deleting image:', imageId, 'for project:', projectId);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Verify ownership through project
  const { data: image } = await supabase
    .from("user_project_images")
    .select("project_id, user_projects!inner(user_id)")
    .eq("id", imageId)
    .single();

  const imageUserId = (image as any)?.user_id;
  if (imageUserId !== user.id) {
    console.error('[PROJECT_IMAGES] Image not owned by user:', imageId);
    return { success: false, error: "Non autorisé" };
  }

  const { error } = await supabase
    .from("user_project_images")
    .delete()
    .eq("id", imageId);

  console.log('[PROJECT_IMAGES] Delete result:', { error: error?.message, code: error?.code });

  if (error) {
    console.error("Error deleting project image:", error);
    return { success: false, error: error.message };
  }

  console.log('[PROJECT_IMAGES] Image deleted successfully');
  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true };
}

export async function setMainProjectImage(imageId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[PROJECT_IMAGES] Setting main image:', imageId, 'for project:', projectId);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // Verify ownership
  const { data: image } = await supabase
    .from("user_project_images")
    .select("project_id, user_projects!inner(user_id)")
    .eq("id", imageId)
    .single();

  const imageUserId = (image as any)?.user_id;
  if (imageUserId !== user.id) {
    console.error('[PROJECT_IMAGES] Image not owned by user:', imageId);
    return { success: false, error: "Non autorisé" };
  }

  // Reset all is_main to false for this project
  await supabase
    .from("user_project_images")
    .update({ is_main: false, updated_at: new Date().toISOString() })
    .eq("project_id", projectId);

  // Set the selected image as main
  const { error } = await supabase
    .from("user_project_images")
    .update({ is_main: true, updated_at: new Date().toISOString() })
    .eq("id", imageId);

  console.log('[PROJECT_IMAGES] Set main result:', { error: error?.message, code: error?.code });

  if (error) {
    console.error("Error setting main image:", error);
    return { success: false, error: error.message };
  }

  console.log('[PROJECT_IMAGES] Main image set successfully');
  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true };
}
