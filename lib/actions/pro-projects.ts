"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProProject, ProProjectFormData } from "@/lib/types/pro-projects";

function log(action: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, ...data }));
}

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
    .select("*")
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
    .select("*")
    .eq("id", id)
    .eq("professional_id", proId)
    .single();

  if (error) {
    console.error("Error fetching pro project:", error);
    return null;
  }

  return data;
}

export async function createProProject(data: ProProjectFormData): Promise<{ data?: ProProject; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { error: "Non autorisé" };

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
    log("pro_project.create.error", { proId, error: error.message });
    return { error: error.message };
  }

  log("pro_project.create.ok", { proId, projectId: project.id, title: project.title });
  revalidatePath("/pro/projets");
  return { data: project };
}

export async function updateProProject(
  id: string,
  data: Partial<ProProjectFormData>
): Promise<{ data?: ProProject; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { error: "Non autorisé" };

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
    log("pro_project.update.error", { id, error: error.message });
    return { error: error.message };
  }

  log("pro_project.update.ok", { id, title: project.title });
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
    log("pro_project.status.update.error", { id, error: error.message });
    return { success: false, error: error.message };
  }

  log("pro_project.status.update.ok", { id, status });
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
    log("pro_project.toggle_public.error", { id, error: error.message });
    return { success: false, error: error.message };
  }

  log("pro_project.toggle_public.ok", { id, isPublic });
  revalidatePath("/pro/projets");
  revalidatePath(`/pro/projets/${id}`);
  return { success: true };
}

export async function updateProProjectPhotos(
  id: string,
  photoUrls: string[],
  featuredPhoto?: string
): Promise<{ success: boolean; error?: string }> {
  const proId = await getProfessionalId();
  if (!proId) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();
  const updateData: Record<string, unknown> = { photo_urls: photoUrls };
  if (featuredPhoto) updateData.featured_photo = featuredPhoto;

  const { error } = await supabase
    .from("pro_projects")
    .update(updateData)
    .eq("id", id)
    .eq("professional_id", proId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/pro/projets");
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
    log("pro_project.delete.error", { id, error: error.message });
    return { success: false, error: error.message };
  }

  log("pro_project.delete.ok", { id });
  revalidatePath("/pro/projets");
  return { success: true };
}

export async function getPublicProProjects(slug: string): Promise<ProProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pro_projects")
    .select("*")
    .eq("is_public", true)
    .eq("professionals:professional_id(slug)", slug)
    .eq("professionals(status)", { not: { eq: 'black' } })
    .order("actual_end_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching public pro projects:", error);
    return [];
  }

  return data || [];
}
