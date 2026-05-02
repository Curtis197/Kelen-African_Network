"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProProject, ProProjectFormData, ProProjectImage, ProProjectStatus } from "@/lib/types/pro-projects";

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

export async function getProProjects(status?: string, limit: number = 100, offset: number = 0): Promise<ProProject[]> {
  const proId = await getProfessionalId();
  if (!proId) {
    return [];
  }

  const supabase = await createClient();

  // 1. Fetch own pro_projects
  let proQuery = supabase
    .from("pro_projects")
    .select("*, images:pro_project_images(*)")
    .eq("professional_id", proId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    proQuery = proQuery.eq("status", status);
  }

  const { data: proData, error: proError } = await proQuery;

  // 2. Fetch collaborations where they are active/negotiating
  // mapping user_projects -> ProProject
  let collabQuery = supabase
    .from("project_collaborations")
    .select(`
      id,
      status,
      created_at,
      project:user_projects (
        id,
        user_id,
        title,
        description,
        category,
        location,
        budget_total,
        budget_currency,
        status,
        created_at,
        images:user_project_images(*),
        client:users!user_id (
          display_name,
          email
        )
      )
    `)
    .eq("professional_id", proId)
    .in("status", ['pending', 'negotiating', 'active', 'terminated'])
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: collabData, error: collabError } = await collabQuery;

  // 3. Unify results
  const unifiedProjects: ProProject[] = [
    ...(proData || []).map(p => ({ ...p, is_collaboration: false })),
    ...(collabData || [])
      .filter(c => c.project) // Safety check
      .map(c => {
        const p = c.project as any;
        return {
          id: p.id,
          professional_id: proId,
          title: p.title,
          description: p.description,
          category: p.category,
          location: p.location,
          client_name: p.client?.display_name || "Client Kelen",
          client_email: p.client?.email || null,
          client_phone: null,
          start_date: p.created_at,
          end_date: null,
          actual_end_date: null,
          budget: p.budget_total,
          currency: p.budget_currency || 'XOF',
          status: mapUserProjectStatusToPro(p.status, c.status),
          is_public: false,
          completion_notes: null,
          created_at: c.created_at || p.created_at,
          updated_at: p.created_at,
          images: p.images?.map((img: any) => ({
            id: img.id,
            pro_project_id: p.id,
            url: img.url,
            is_main: img.is_main,
            order_index: 0,
            created_at: img.created_at,
            updated_at: img.updated_at
          })) || [],
          is_collaboration: true,
          collaboration_id: c.id,
          client_user_id: p.user_id
        } as ProProject;
      })
  ];

  // 4. Sort and return
  const result = unifiedProjects.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return result;
}

// Helper to map status
function mapUserProjectStatusToPro(userStatus: string, collabStatus: string): ProProjectStatus {
  if (collabStatus === 'active') return 'in_progress';
  if (collabStatus === 'terminated') return 'completed';
  if (userStatus === 'termine') return 'completed';
  if (userStatus === 'annule') return 'cancelled';
  if (userStatus === 'en_pause') return 'paused';
  return 'in_progress';
}

export async function getProProject(id: string): Promise<ProProject | null> {
  const supabase = await createClient();
  const proId = await getProfessionalId();
  if (!proId) {
    return null;
  }

  // 1. Try pro_projects first
  const { data: proProject, error: proError } = await supabase
    .from("pro_projects")
    .select("*, images:pro_project_images(*)")
    .eq("id", id)
    .eq("professional_id", proId)
    .single();

  if (proProject) {
    return { ...proProject, is_collaboration: false };
  }

  // 2. Try collaborations/user_projects
  const { data: collab, error: collabError } = await supabase
    .from("project_collaborations")
    .select(`
      id,
      status,
      created_at,
      project:user_projects (
        id,
        user_id,
        title,
        description,
        category,
        location,
        budget_total,
        budget_currency,
        status,
        created_at,
        images:user_project_images(*),
        client:users!user_id (
          display_name,
          email
        )
      )
    `)
    .eq("project_id", id) // We assume the ID passed is the user_project ID
    .eq("professional_id", proId)
    .single();

  if (collab && collab.project) {
    const p = collab.project as any;
    return {
      id: p.id,
      professional_id: proId,
      title: p.title,
      description: p.description,
      category: p.category,
      location: p.location,
      client_name: p.client?.display_name || "Client Kelen",
      client_email: p.client?.email || null,
      client_phone: null,
      start_date: p.created_at,
      end_date: null,
      actual_end_date: null,
      budget: p.budget_total,
      currency: p.budget_currency || 'XOF',
      status: mapUserProjectStatusToPro(p.status, collab.status),
      is_public: false,
      completion_notes: null,
      created_at: collab.created_at || p.created_at,
      updated_at: p.created_at,
      images: p.images?.map((img: any) => ({
        id: img.id,
        pro_project_id: p.id,
        url: img.url,
        is_main: img.is_main,
        order_index: 0,
        created_at: img.created_at,
        updated_at: img.updated_at
      })) || [],
      is_collaboration: true,
      collaboration_id: collab.id,
      client_user_id: p.user_id
    } as ProProject;
  }

  return null;
}

export async function createProProject(data: ProProjectFormData, imageUrls?: string[]): Promise<{ data?: ProProject; error?: string }> {
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
    return { error: error.message };
  }

  // Insert images into pro_project_images table
  if (imageUrls && imageUrls.length > 0 && project) {
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
      // Don't fail the whole operation, just log the error
    }
  }

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
    return { error: error.message };
  }

  // Update images if provided
  if (imageUrls && imageUrls.length > 0) {
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
      // Non-fatal
    }
  }

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
    return { success: false, error: error.message };
  }

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
    return { success: false, error: error.message };
  }

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
    return { success: false, error: error.message };
  }

  revalidatePath("/pro/projets");
  return { success: true };
}

export async function getPublicProProjects(slug: string, limit: number = 100, offset: number = 0): Promise<ProProject[]> {
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
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
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
    return { success: false, error: error.message };
  }

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
    return { success: false, error: error.message };
  }

  revalidatePath(`/pro/projets/${projectId}`);
  return { success: true };
}
