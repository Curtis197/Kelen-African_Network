"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

function log(action: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), action, ...data }));
}

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Le titre est requis").optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  location_country: z.string().optional(),
  location_formatted: z.string().optional(),
  budget_total: z.number().min(0, "Le budget doit être positif").optional(),
  budget_currency: z.enum(["EUR", "XOF", "USD"]).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
  objectives: z.array(z.string()).optional(),
});

export async function upsertProject(data: z.infer<typeof projectSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Vous devez être connecté");
  }

  const validatedData = projectSchema.parse(data);
  const projectId = validatedData.id;
  const projectFields = { ...validatedData };
  delete projectFields.id;

  if (projectId) {
    // Update
    const { data: updated, error } = await supabase
      .from("user_projects")
      .update(projectFields)
      .eq("id", projectId)
      .eq("user_id", user.id) // Ensure ownership
      .select()
      .single();

    if (error) {
      log("project.update.error", { userId: user.id, projectId, error: error.message });
      console.error("Error updating project:", error);
      return { error: error.message };
    }
    log("project.update.ok", { userId: user.id, projectId, title: validatedData.title });
    return { data: updated };
  } else {
    // Create
    const { data: created, error } = await supabase
      .from("user_projects")
      .insert([{
        ...projectFields,
        user_id: user.id,
        status: "en_preparation",
      }])
      .select()
      .single();

    if (error) {
      log("project.create.error", { userId: user.id, title: validatedData.title, error: error.message });
      console.error("Error creating project:", error);
      return { error: error.message };
    }

    log("project.create.ok", { userId: user.id, projectId: created.id, title: created.title });

    return { data: created };
  }
}

export async function createProject(formData: FormData) {
  // Existing function can be kept for compatibility if needed, 
  // but we'll use upsertProject for the wizard.
  const rawData = {
    title: formData.get("title") as string,
    category: formData.get("category") as any,
    location: formData.get("location") as string,
    budget_total: Number(formData.get("budget_total")),
    budget_currency: formData.get("budget_currency") as any,
    start_date: formData.get("start_date") as string || undefined,
    end_date: formData.get("end_date") as string || undefined,
    description: formData.get("description") as string || undefined,
    objectives: JSON.parse(formData.get("objectives") as string || "[]"),
  };
  
  const result = await upsertProject(rawData);
  if (result.error) return { error: result.error };
  
  revalidatePath("/projets");
  redirect(`/projets/${result.data.id}`);
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient();
  
  // Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Vous devez être connecté" };
  }

  // Verify user owns the project
  const { data: project, error: fetchError } = await supabase
    .from("user_projects")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !project) {
    return { error: "Projet introuvable" };
  }

  if (project.user_id !== user.id) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase
    .from("user_projects")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Error updating project status:", error);
    return { error: error.message };
  }

  revalidatePath(`/projets/${id}`);
  revalidatePath("/projets");
}

export async function getProject(id: string) {
  if (!id || id === 'null' || id === 'undefined' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }

  return data;
}

export async function getProjectTeam(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_professionals")
    .select("*, professionals(business_name, category, portfolio_photos, status, slug)")
    .eq("project_id", projectId)
    .order("rank_order", { ascending: true });

  if (error) {
    console.error("Error fetching project team:", error);
    return [];
  }

  return data;
}


export async function manageProjectProfessional(
  projectId: string,
  proId: string | null,
  area: string,
  action: 'add' | 'remove',
  isExternal: boolean = false,
  externalData?: { name?: string; phone?: string; category?: string; location?: string; note?: string },
  areaId?: string
) {
  console.log('[MANAGE_PROJECT_PROFESSIONAL] Called with:', { projectId, proId, area, action, isExternal, areaId });
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log('[MANAGE_PROJECT_PROFESSIONAL] Auth result:', { hasUser: !!user, authError: authError?.message });

  if (!user) {
    console.error('[MANAGE_PROJECT_PROFESSIONAL] ❌ No authenticated user!');
    throw new Error("Non autorisé");
  }

  if (action === 'add') {
    const insertData: any = {
      project_id: projectId,
      development_area: area,
      is_external: isExternal,
    };

    if (isExternal) {
      insertData.external_name = externalData?.name;
      insertData.external_phone = externalData?.phone;
      insertData.external_category = externalData?.category;
      insertData.external_location = externalData?.location;
      insertData.private_note = externalData?.note;
    } else {
      insertData.professional_id = proId;
    }

    if (areaId) {
      insertData.project_area_id = areaId;
    }

    console.log('[MANAGE_PROJECT_PROFESSIONAL] Inserting to project_professionals:', insertData);

    // Check if the area exists in project_areas, if not create it
    const { data: existingArea } = await supabase
      .from("project_areas")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", area)
      .single();

    console.log('[MANAGE_PROJECT_PROFESSIONAL] Existing area check:', { exists: !!existingArea, areaName: area });

    if (!existingArea) {
      console.log('[MANAGE_PROJECT_PROFESSIONAL] Area not found, creating it...');
      const { data: newArea, error: areaError } = await supabase
        .from("project_areas")
        .insert([{ project_id: projectId, name: area }])
        .select()
        .single();

      if (areaError) {
        console.error('[MANAGE_PROJECT_PROFESSIONAL] ❌ Failed to create area:', areaError.message);
      } else {
        console.log('[MANAGE_PROJECT_PROFESSIONAL] ✅ Created area:', newArea.id);
        insertData.project_area_id = newArea.id;
      }
    } else {
      insertData.project_area_id = existingArea.id;
    }

    const { data, error } = await supabase
      .from("project_professionals")
      .insert([insertData])
      .select();

    console.log('[MANAGE_PROJECT_PROFESSIONAL] Insert result:', { data, error: error?.message, errorCode: error?.code });

    if (error) {
      console.error('[MANAGE_PROJECT_PROFESSIONAL] ❌ Database insert error:', error.message);
      if (error.code === '42501') {
        console.error('[MANAGE_PROJECT_PROFESSIONAL] ❌ EXPLICIT RLS BLOCKING! Table: project_professionals');
        console.error('[MANAGE_PROJECT_PROFESSIONAL] RLS policy is blocking insert for user:', user.id);
      }
      log("project.pro.add.error", { userId: user.id, projectId, area, isExternal, proId, error: error.message });
      return { success: false, error: error.message };
    }
    console.log('[MANAGE_PROJECT_PROFESSIONAL] ✅ Successfully added pro to project:', data);
    log("project.pro.add.ok", { userId: user.id, projectId, area, isExternal, proId: isExternal ? null : proId, externalName: isExternal ? externalData?.name : null });
  } else {
    const { error } = await supabase
      .from("project_professionals")
      .delete()
      .eq("project_id", projectId)
      .eq(isExternal ? "external_name" : "professional_id", isExternal ? externalData?.name : proId)
      .eq("development_area", area);

    if (error) {
      log("project.pro.remove.error", { userId: user.id, projectId, area, isExternal, proId, error: error.message });
      return { error: error.message };
    }
    log("project.pro.remove.ok", { userId: user.id, projectId, area, isExternal, proId: isExternal ? null : proId });
  }

  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}

export async function updateProfessionalRank(projectId: string, linkId: string, rank: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_professionals")
    .update({ rank_order: rank })
    .eq("id", linkId);

  if (error) {
    log("project.pro.rank.error", { projectId, linkId, rank, error: error.message });
    return { error: error.message };
  }
  log("project.pro.rank.ok", { projectId, linkId, rank });
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}

export async function updateProfessionalSelection(projectId: string, linkId: string, status: 'candidate' | 'shortlisted' | 'finalist') {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_professionals")
    .update({ selection_status: status })
    .eq("id", linkId);

  if (error) {
    log("project.pro.selection.error", { projectId, linkId, status, error: error.message });
    return { error: error.message };
  }
  log("project.pro.selection.ok", { projectId, linkId, status });
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}

export async function getUserProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_projects")
    .select("id, title, category, location")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching user projects:", error);
    return [];
  }

  return data;
}

export async function getProjectAreas(projectId: string) {
  console.log('[GET_PROJECT_AREAS] Fetching areas for project:', projectId);
  const supabase = await createClient();
  
  // First, get all unique development_area values from project_professionals
  const { data: professionals, error: proError } = await supabase
    .from("project_professionals")
    .select("development_area")
    .eq("project_id", projectId)
    .not("development_area", "is", null);

  if (proError) {
    console.error('[GET_PROJECT_AREAS] Error fetching professionals:', proError.message);
  }

  // Extract unique area names from professionals
  const uniqueAreasFromPros = [...new Set(professionals?.map(p => p.development_area).filter(Boolean))] as string[];
  console.log('[GET_PROJECT_AREAS] Unique areas from professionals:', uniqueAreasFromPros);

  // Get existing project_areas
  const { data: existingAreas, error: areaError } = await supabase
    .from("project_areas")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (areaError) {
    console.error('[GET_PROJECT_AREAS] Error fetching project_areas:', areaError.message);
    return [];
  }

  const existingAreaNames = existingAreas?.map(a => a.name) || [];
  console.log('[GET_PROJECT_AREAS] Existing project_areas:', existingAreaNames);

  // Create missing areas
  const missingAreas = uniqueAreasFromPros.filter(name => !existingAreaNames.includes(name));
  console.log('[GET_PROJECT_AREAS] Missing areas to create:', missingAreas);

  if (missingAreas.length > 0) {
    const { data: newAreas, error: insertError } = await supabase
      .from("project_areas")
      .insert(missingAreas.map(name => ({ project_id: projectId, name })))
      .select();

    if (insertError) {
      console.error('[GET_PROJECT_AREAS] Error creating missing areas:', insertError.message);
    } else {
      console.log('[GET_PROJECT_AREAS] Created', newAreas?.length, 'new areas');
    }
  }

  // Fetch all areas again (including newly created ones)
  const { data: allAreas, error: finalError } = await supabase
    .from("project_areas")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (finalError) {
    console.error('[GET_PROJECT_AREAS] Final fetch error:', finalError.message);
    return [];
  }

  console.log('[GET_PROJECT_AREAS] Returning', allAreas?.length, 'areas');
  return allAreas;
}

export async function createProjectArea(projectId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  const { data, error } = await supabase
    .from("project_areas")
    .insert([{ project_id: projectId, name }])
    .select()
    .single();

  if (error) {
    log("area.create.error", { userId: user.id, projectId, name, error: error.message });
    return { error: error.message };
  }
  log("area.create.ok", { userId: user.id, projectId, areaId: data.id, name });
  revalidatePath(`/projets/${projectId}`);
  return { data };
}

/**
 * Sync project_areas from project_professionals.development_area
 * Ensures all areas used by professionals exist in project_areas table
 */
export async function syncProjectAreasFromProfessionals(projectId: string) {
  console.log('[SYNC_AREAS] Syncing areas for project:', projectId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  // Get unique areas from professionals
  const { data: professionals, error: proError } = await supabase
    .from("project_professionals")
    .select("development_area")
    .eq("project_id", projectId)
    .not("development_area", "is", null);

  if (proError) {
    console.error('[SYNC_AREAS] Error fetching professionals:', proError.message);
    return { error: proError.message };
  }

  const uniqueAreasFromPros = [...new Set(professionals?.map(p => p.development_area).filter(Boolean))] as string[];
  console.log('[SYNC_AREAS] Unique areas from professionals:', uniqueAreasFromPros);

  // Get existing areas
  const { data: existingAreas, error: areaError } = await supabase
    .from("project_areas")
    .select("name")
    .eq("project_id", projectId);

  if (areaError) {
    console.error('[SYNC_AREAS] Error fetching existing areas:', areaError.message);
    return { error: areaError.message };
  }

  const existingAreaNames = existingAreas?.map(a => a.name) || [];
  const missingAreas = uniqueAreasFromPros.filter(name => !existingAreaNames.includes(name));

  console.log('[SYNC_AREAS] Missing areas:', missingAreas);

  // Create missing areas
  if (missingAreas.length > 0) {
    const { data: newAreas, error: insertError } = await supabase
      .from("project_areas")
      .insert(missingAreas.map(name => ({ project_id: projectId, name })))
      .select();

    if (insertError) {
      console.error('[SYNC_AREAS] Error creating areas:', insertError.message);
      return { error: insertError.message };
    }

    console.log('[SYNC_AREAS] Created', newAreas?.length, 'new areas');
  }

  revalidatePath(`/projets/${projectId}`);
  return { success: true, synced: missingAreas.length };
}

export async function updateExternalProfessional(
  linkId: string,
  projectId: string,
  data: { name?: string; phone?: string; category?: string; location?: string; note?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: updated, error } = await supabase
    .from("project_professionals")
    .update({
      external_name: data.name,
      external_phone: data.phone,
      external_category: data.category,
      external_location: data.location,
      private_note: data.note,
    })
    .eq("id", linkId)
    .eq("is_external", true)
    .select()
    .single();

  if (error) {
    log("project.pro.external.update.error", { userId: user.id, projectId, linkId, error: error.message });
    return { error: error.message };
  }
  log("project.pro.external.update.ok", { userId: user.id, projectId, linkId });
  revalidatePath(`/projets/${projectId}`);
  return { data: updated };
}

export async function updateProjectArea(areaId: string, projectId: string, newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  const { data, error } = await supabase
    .from("project_areas")
    .update({ name: newName })
    .eq("id", areaId)
    .select()
    .single();

  if (error) {
    log("area.update.error", { userId: user.id, projectId, areaId, newName, error: error.message });
    return { error: error.message };
  }
  log("area.update.ok", { userId: user.id, projectId, areaId, newName });
  revalidatePath(`/projets/${projectId}`);
  return { data };
}

export async function deleteProjectArea(areaId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  const { error } = await supabase
    .from("project_areas")
    .delete()
    .eq("id", areaId);

  if (error) {
    log("area.delete.error", { userId: user.id, projectId, areaId, error: error.message });
    return { error: error.message };
  }
  log("area.delete.ok", { userId: user.id, projectId, areaId });
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}

/**
 * Add a development area to user_projects.development_areas array
 */
export async function addProjectDevelopmentArea(projectId: string, area: string) {
  console.log('[ADD_PROJECT_DEVELOPMENT_AREA] Adding area to project:', { projectId, area });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, development_areas")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  const currentAreas = (project.development_areas as string[]) || [];
  
  // Don't add if already exists
  if (currentAreas.includes(area)) {
    console.log('[ADD_PROJECT_DEVELOPMENT_AREA] Area already exists:', area);
    return { success: true, data: currentAreas };
  }

  const newAreas = [...currentAreas, area];
  console.log('[ADD_PROJECT_DEVELOPMENT_AREA] New areas array:', newAreas);

  const { data, error } = await supabase
    .from("user_projects")
    .update({ development_areas: newAreas })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    console.error('[ADD_PROJECT_DEVELOPMENT_AREA] Error:', error.message);
    log("project.development_area.add.error", { userId: user.id, projectId, area, error: error.message });
    return { error: error.message };
  }

  log("project.development_area.add.ok", { userId: user.id, projectId, area });
  revalidatePath(`/projets/${projectId}`);
  return { success: true, data: newAreas };
}

/**
 * Remove a development area from user_projects.development_areas array
 */
export async function removeProjectDevelopmentArea(projectId: string, area: string) {
  console.log('[REMOVE_PROJECT_DEVELOPMENT_AREA] Removing area from project:', { projectId, area });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, development_areas")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accès refusé." };

  const currentAreas = (project.development_areas as string[]) || [];
  const newAreas = currentAreas.filter(a => a !== area);
  console.log('[REMOVE_PROJECT_DEVELOPMENT_AREA] New areas array:', newAreas);

  const { data, error } = await supabase
    .from("user_projects")
    .update({ development_areas: newAreas })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    console.error('[REMOVE_PROJECT_DEVELOPMENT_AREA] Error:', error.message);
    log("project.development_area.remove.error", { userId: user.id, projectId, area, error: error.message });
    return { error: error.message };
  }

  log("project.development_area.remove.ok", { userId: user.id, projectId, area });
  revalidatePath(`/projets/${projectId}`);
  return { success: true, data: newAreas };
}
