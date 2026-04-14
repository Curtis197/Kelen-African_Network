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
  console.log('[PROJECT_IMAGES] ========== DELETE IMAGE START ==========');
  console.log('[PROJECT_IMAGES] Deleting image:', imageId, 'for project:', projectId);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  console.log('[PROJECT_IMAGES] Auth user:', user?.id);
  if (!user) {
    console.error('[PROJECT_IMAGES] ❌ No authenticated user');
    return { success: false, error: "Non authentifié" };
  }

  // First, verify the image exists and get its project_id
  const { data: image, error: fetchError } = await supabase
    .from("user_project_images")
    .select("id, project_id")
    .eq("id", imageId)
    .single();

  console.log('[PROJECT_IMAGES] Fetch image result:', { 
    image: image, 
    fetchError: fetchError?.message,
    errorCode: fetchError?.code 
  });

  if (fetchError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_project_images SELECT!');
    console.error('[RLS] Cannot even read image to verify ownership');
    console.error('[RLS] Image ID:', imageId);
    console.error('[RLS] User ID:', user.id);
    return { success: false, error: "Non autorisé - RLS bloque la lecture" };
  }

  if (fetchError || !image) {
    console.error('[PROJECT_IMAGES] Image not found:', imageId, fetchError?.message);
    return { success: false, error: "Image non trouvée" };
  }

  // Verify the image belongs to the specified project
  if (image.project_id !== projectId) {
    console.error('[PROJECT_IMAGES] Image project mismatch:', {
      imageProjectId: image.project_id,
      requestedProjectId: projectId
    });
    return { success: false, error: "Image ne correspond pas au projet" };
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  console.log('[PROJECT_IMAGES] Project ownership check:', { 
    projectFound: !!project, 
    projectUserId: project?.user_id 
  });

  if (!project) {
    console.error('[PROJECT_IMAGES] ❌ User does not own project:', projectId);
    return { success: false, error: "Non autorisé - projet non possédé" };
  }

  console.log('[PROJECT_IMAGES] ✅ Ownership verified, proceeding with delete');

  const { error: deleteError } = await supabase
    .from("user_project_images")
    .delete()
    .eq("id", imageId);

  console.log('[PROJECT_IMAGES] Delete result:', { 
    error: deleteError?.message, 
    code: deleteError?.code,
    details: deleteError?.details 
  });

  if (deleteError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_project_images DELETE!');
    console.error('[RLS] Table: user_project_images');
    console.error('[RLS] Image ID:', imageId);
    console.error('[RLS] Project ID:', projectId);
    console.error('[RLS] User ID:', user.id);
    console.error('[RLS] Fix: Check DELETE policy - should allow DELETE when project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())');
    return { success: false, error: "Non autorisé - RLS bloque la suppression" };
  }

  if (deleteError) {
    console.error("[PROJECT_IMAGES] Error deleting project image:", deleteError);
    return { success: false, error: deleteError.message };
  }

  console.log('[PROJECT_IMAGES] ✅ Image deleted successfully');
  console.log('[PROJECT_IMAGES] ========== DELETE IMAGE FINISHED ==========');
  
  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true };
}

export async function setMainProjectImage(imageId: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[PROJECT_IMAGES] ========== SET MAIN IMAGE START ==========');
  console.log('[PROJECT_IMAGES] Setting main image:', imageId, 'for project:', projectId);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  console.log('[PROJECT_IMAGES] Auth user:', user?.id);
  if (!user) {
    console.error('[PROJECT_IMAGES] ❌ No authenticated user');
    return { success: false, error: "Non authentifié" };
  }

  // First, verify the image exists and belongs to the project
  const { data: image, error: fetchError } = await supabase
    .from("user_project_images")
    .select("id, project_id")
    .eq("id", imageId)
    .single();

  console.log('[PROJECT_IMAGES] Fetch image result:', { 
    image: image, 
    fetchError: fetchError?.message,
    errorCode: fetchError?.code 
  });

  if (fetchError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_project_images SELECT!');
    console.error('[RLS] Image ID:', imageId);
    console.error('[RLS] User ID:', user.id);
    return { success: false, error: "Non autorisé - RLS bloque la lecture" };
  }

  if (fetchError || !image) {
    console.error('[PROJECT_IMAGES] Image not found:', imageId);
    return { success: false, error: "Image non trouvée" };
  }

  // Verify user owns the project
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  console.log('[PROJECT_IMAGES] Project ownership check:', { 
    projectFound: !!project, 
    projectUserId: project?.user_id 
  });

  if (!project) {
    console.error('[PROJECT_IMAGES] ❌ User does not own project:', projectId);
    return { success: false, error: "Non autorisé - projet non possédé" };
  }

  // Verify image belongs to the project
  if (image.project_id !== projectId) {
    console.error('[PROJECT_IMAGES] Image does not belong to project:', {
      imageProjectId: image.project_id,
      projectId
    });
    return { success: false, error: "Image ne correspond pas au projet" };
  }

  console.log('[PROJECT_IMAGES] ✅ Ownership verified, proceeding with update');

  // Reset all is_main to false for this project
  const { error: resetError } = await supabase
    .from("user_project_images")
    .update({ is_main: false, updated_at: new Date().toISOString() })
    .eq("project_id", projectId);

  console.log('[PROJECT_IMAGES] Reset all is_main result:', {
    error: resetError?.message,
    code: resetError?.code
  });

  if (resetError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_project_images UPDATE!');
    console.error('[RLS] Image ID:', imageId);
    console.error('[RLS] User ID:', user.id);
    return { success: false, error: "Non autorisé - RLS bloque la mise à jour" };
  }

  if (resetError) {
    console.error("[PROJECT_IMAGES] Error resetting main images:", resetError);
    return { success: false, error: resetError.message };
  }

  // Set the selected image as main
  const { error: updateError } = await supabase
    .from("user_project_images")
    .update({ is_main: true, updated_at: new Date().toISOString() })
    .eq("id", imageId);

  console.log('[PROJECT_IMAGES] Set main image result:', { 
    error: updateError?.message, 
    code: updateError?.code,
    details: updateError?.details 
  });

  if (updateError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_project_images UPDATE!');
    console.error('[RLS] Table: user_project_images');
    console.error('[RLS] Image ID:', imageId);
    console.error('[RLS] Project ID:', projectId);
    console.error('[RLS] User ID:', user.id);
    console.error('[RLS] Fix: Check UPDATE policy - should allow UPDATE when project_id IN (SELECT id FROM user_projects WHERE user_id = auth.uid())');
    return { success: false, error: "Non autorisé - RLS bloque la mise à jour" };
  }

  if (updateError) {
    console.error("[PROJECT_IMAGES] Error setting main image:", updateError);
    return { success: false, error: updateError.message };
  }

  console.log('[PROJECT_IMAGES] ✅ Main image set successfully');
  console.log('[PROJECT_IMAGES] ========== SET MAIN IMAGE FINISHED ==========');
  
  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/modifier`);
  revalidatePath("/projets");

  return { success: true };
}
