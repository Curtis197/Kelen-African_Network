"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProProject, ProProjectFormData, ProProjectImage } from "@/lib/types/pro-projects";

console.log("[pro-projects] Server action loaded");

async function getProfessionalId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return data?.id || null;
}

export async function getProProjects(status?: string): Promise<ProProject[]> {
  const proId = await getProfessionalId();
  if (!proId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("pro_projects")
    .select("*, images:pro_project_images(*)")
    .eq("professional_id", proId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching pro projects:", error);
    return [];
  }

  return data || [];
}

export async function getProProject(id: string): Promise<ProProject | null> {
  const supabase = await createClient();
  const proId = await getProfessionalId();
  if (!proId) return null;

  const { data, error } = await supabase
    .from("pro_projects")
    .select("*, images:pro_project_images(*)")
    .eq("id", id)
    .eq("professional_id", proId)
    .single();

  if (error) {
    console.error("Error fetching pro project:", error);
    return null;
  }

  return data;
}

export async function createProProject(data: ProProjectFormData, imageUrls?: string[]): Promise<{ data?: ProProject; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { error: "Non autorisé" };

  console.log("[createProProject] Creating project", { proId, imageCount: imageUrls?.length });

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("pro_projects")
    .insert([{
      professional_id: proId,
      title: data.title,
      description: data.description || null,
      category: data.category,
      location: data.location || null,
      client_name: data.client_name || null,
      client_email: data.client_email || null,
      client_phone: data.client_phone || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget || null,
      currency: data.currency,
      status: data.status,
      is_public: data.is_public,
      completion_notes: data.completion_notes || null,
    }])
    .select()
    .single();

  if (error) {
    console.error("[createProProject] Error", { error: error.message });
    return { error: error.message };
  }

  // Insert images into pro_project_images table
  if (imageUrls && imageUrls.length > 0 && project) {
    console.log("[createProProject] Inserting images", { count: imageUrls.length });
    const imageRows = imageUrls.map((url, idx) => ({
      pro_project_id: project.id,
      url,
      is_main: idx === 0, // First image is main by default
      order_index: idx,
    }));

    const { error: imgError } = await supabase
      .from("pro_project_images")
      .insert(imageRows);

    if (imgError) {
      console.error("[createProProject] Image insert error", { error: imgError.message });
      // Don't fail the whole operation, just log the error
    }
  }

  console.log("[createProProject] OK", { projectId: project.id });
  revalidatePath("/pro/projets");
  return { data: project };
}

export async function updateProProject(
  id: string,
  data: Partial<ProProjectFormData>,
  imageUrls?: string[]
): Promise<{ data?: ProProject; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { error: "Non autorisé" };

  console.log("[updateProProject] Updating project", { id, imageCount: imageUrls?.length });

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("pro_projects")
    .select("id")
    .eq("id", id)
    .eq("professional_id", proId)
    .single();

  if (!existing) return { error: "Projet introuvable" };

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.client_name !== undefined) updateData.client_name = data.client_name || null;
  if (data.client_email !== undefined) updateData.client_email = data.client_email || null;
  if (data.client_phone !== undefined) updateData.client_phone = data.client_phone || null;
  if (data.start_date !== undefined) updateData.start_date = data.start_date || null;
  if (data.end_date !== undefined) updateData.end_date = data.end_date || null;
  if (data.budget !== undefined) updateData.budget = data.budget || null;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.is_public !== undefined) updateData.is_public = data.is_public;
  if (data.completion_notes !== undefined) updateData.completion_notes = data.completion_notes || null;

  const { data: project, error } = await supabase
    .from("pro_projects")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateProProject] Error", { error: error.message });
    return { error: error.message };
  }

  // Update images if provided
  if (imageUrls && imageUrls.length > 0) {
    console.log("[updateProProject] Updating images", { count: imageUrls.length });
    
    // Delete existing images
    await supabase
      .from("pro_project_images")
      .delete()
      .eq("pro_project_id", id);

    // Insert new images
    const imageRows = imageUrls.map((url, idx) => ({
      pro_project_id: id,
      url,
      is_main: idx === 0,
      order_index: idx,
    }));

    const { error: imgError } = await supabase
      .from("pro_project_images")
      .insert(imageRows);

    if (imgError) {
      console.error("[updateProProject] Image update error", { error: imgError.message });
    }
  }

  console.log("[updateProProject] OK", { id });
  revalidatePath("/pro/projets");
  return { data: project };
}

export async function updateProProjectStatus(
  id: string,
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled'
): Promise<{ success: boolean; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();
  const updateData: Record<string, unknown> = { status };

  if (status === 'completed') {
    updateData.actual_end_date = new Date().toISOString().split('T')[0];
  }

  const { error } = await supabase
    .from("pro_projects")
    .update(updateData)
    .eq("id", id)
    .eq("professional_id", proId);

  if (error) {
    console.error("[updateProProjectStatus] Error", { error: error.message });
    return { success: false, error: error.message };
  }

  console.log("[updateProProjectStatus] OK", { id, status });
  revalidatePath("/pro/projets");
  return { success: true };
}

export async function toggleProProjectPublic(
  id: string,
  isPublic: boolean
): Promise<{ success: boolean; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pro_projects")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("professional_id", proId);

  if (error) {
    console.error("[toggleProProjectPublic] Error", { error: error.message });
    return { success: false, error: error.message };
  }

  console.log("[toggleProProjectPublic] OK", { id, isPublic });
  revalidatePath("/pro/projets");
  revalidatePath(`/pro/projets/${id}`);
  return { success: true };
}

export async function deleteProProject(id: string): Promise<{ success: boolean; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pro_projects")
    .delete()
    .eq("id", id)
    .eq("professional_id", proId);

  if (error) {
    console.error("[deleteProProject] Error", { error: error.message });
    return { success: false, error: error.message };
  }

  console.log("[deleteProProject] OK", { id });
  revalidatePath("/pro/projets");
  return { success: true };
}

export async function getPublicProProjects(slug: string): Promise<ProProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pro_projects")
    .select(`
      *,
      images:pro_project_images(*),
      professionals!inner(slug)
    `)
    .eq("is_public", true)
    .eq("professionals.slug", slug)
    .neq("professionals.status", "black")
    .order("actual_end_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching public pro projects:", error);
    return [];
  }

  return data || [];
}

export async function setMainProjectImage(
  projectId: string,
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();

  // Verify ownership
  const { data: project } = await supabase
    .from("pro_projects")
    .select("id")
    .eq("id", projectId)
    .eq("professional_id", proId)
    .single();

  if (!project) return { success: false, error: "Projet introuvable" };

  // Set all images to not main
  await supabase
    .from("pro_project_images")
    .update({ is_main: false })
    .eq("pro_project_id", projectId);

  // Set selected image as main
  const { error } = await supabase
    .from("pro_project_images")
    .update({ is_main: true })
    .eq("id", imageId)
    .eq("pro_project_id", projectId);

  if (error) {
    console.error("[setMainProjectImage] Error", { error: error.message });
    return { success: false, error: error.message };
  }

  console.log("[setMainProjectImage] OK", { projectId, imageId });
  revalidatePath(`/pro/projets/${projectId}`);
  return { success: true };
}

export async function deleteProjectImage(
  projectId: string,
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();

  // Verify ownership
  const { data: project } = await supabase
    .from("pro_projects")
    .select("id")
    .eq("id", projectId)
    .eq("professional_id", proId)
    .single();

  if (!project) return { success: false, error: "Projet introuvable" };

  const { error } = await supabase
    .from("pro_project_images")
    .delete()
    .eq("id", imageId)
    .eq("pro_project_id", projectId);

  if (error) {
    console.error("[deleteProjectImage] Error", { error: error.message });
    return { success: false, error: error.message };
  }

  console.log("[deleteProjectImage] OK", { projectId, imageId });
  revalidatePath(`/pro/projets/${projectId}`);
  return { success: true };
}
