"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Le titre est requis").optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  location_country: z.string().optional(),
  location_formatted: z.string().optional(),
  budget_total: z.number().min(0, "Le budget doit Ãªtre positif").optional(),
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
    throw new Error("Vous devez Ãªtre connectÃ©");
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
      return { error: error.message };
    }
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
      return { error: error.message };
    }


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
    return { error: "Vous devez Ãªtre connectÃ©" };
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
    return { error: "Non autorisÃ©" };
  }

  const { error } = await supabase
    .from("user_projects")
    .update({ status })
    .eq("id", id);

  if (error) {
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
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();


  if (!user) {
    throw new Error("Non autorisÃ©");
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


    // Check if the area exists in project_areas, if not create it
    const { data: existingArea } = await supabase
      .from("project_areas")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", area)
      .single();


    if (!existingArea) {
      const { data: newArea, error: areaError } = await supabase
        .from("project_areas")
        .insert([{ project_id: projectId, name: area }])
        .select()
        .single();

      if (areaError) {
      } else {
        insertData.project_area_id = newArea.id;
      }
    } else {
      insertData.project_area_id = existingArea.id;
    }

    const { data, error } = await supabase
      .from("project_professionals")
      .insert([insertData])
      .select();


    if (error) {
      if (error.code === '42501') {
      }
      return { success: false, error: error.message };
    }
  } else {
    
    // We try to be as precise as possible for deletion
    const query = supabase
      .from("project_professionals")
      .delete()
      .eq("project_id", projectId);

    if (isExternal) {
      query.eq("external_name", externalData?.name).eq("is_external", true);
    } else {
      query.eq("professional_id", proId).eq("is_external", false);
    }

    if (area) {
      query.eq("development_area", area);
    }
    
    // If areaId is provided, use it for extra precision
    if (areaId) {
      query.eq("project_area_id", areaId);
    }

    const { error, count } = await query;


    if (error) {
      return { error: error.message };
    }
    
    if (count === 0) {
    }

  }

  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/pros`); // Added sync for pros page
  return { success: true };
}

export async function updateProfessionalRank(projectId: string, linkId: string, rank: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_professionals")
    .update({ rank_order: rank })
    .eq("id", linkId);

  if (error) {
    return { error: error.message };
  }
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
    return { error: error.message };
  }
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}

export async function getUserProjects(limit: number = 100, offset: number = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_projects")
    .select("id, title, category, location, development_areas")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return [];
  }

  });

  return data;
}

export async function getProjectAreas(projectId: string) {
  const supabase = await createClient();
  
  // First, get all unique development_area values from project_professionals
  const { data: professionals, error: proError } = await supabase
    .from("project_professionals")
    .select("development_area")
    .eq("project_id", projectId)
    .not("development_area", "is", null);

  if (proError) {
  }

  // Extract unique area names from professionals
  const uniqueAreasFromPros = [...new Set(professionals?.map(p => p.development_area).filter(Boolean))] as string[];

  // Get existing project_areas
  const { data: existingAreas, error: areaError } = await supabase
    .from("project_areas")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (areaError) {
    return [];
  }

  const existingAreaNames = existingAreas?.map(a => a.name) || [];

  // Create missing areas
  const missingAreas = uniqueAreasFromPros.filter(name => !existingAreaNames.includes(name));

  if (missingAreas.length > 0) {
    const { data: newAreas, error: insertError } = await supabase
      .from("project_areas")
      .insert(missingAreas.map(name => ({ project_id: projectId, name })))
      .select();

    if (insertError) {
    } else {
    }
  }

  // Fetch all areas again (including newly created ones)
  const { data: allAreas, error: finalError } = await supabase
    .from("project_areas")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (finalError) {
    return [];
  }

  return allAreas;
}

export async function createProjectArea(projectId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisÃ©" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accÃ¨s refusÃ©." };

  const { data, error } = await supabase
    .from("project_areas")
    .insert([{ project_id: projectId, name }])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }
  revalidatePath(`/projets/${projectId}`);
  return { data };
}

/**
 * Sync project_areas from project_professionals.development_area
 * Ensures all areas used by professionals exist in project_areas table
 */
export async function syncProjectAreasFromProfessionals(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisÃ©" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accÃ¨s refusÃ©." };

  // Get unique areas from professionals
  const { data: professionals, error: proError } = await supabase
    .from("project_professionals")
    .select("development_area")
    .eq("project_id", projectId)
    .not("development_area", "is", null);

  if (proError) {
    return { error: proError.message };
  }

  const uniqueAreasFromPros = [...new Set(professionals?.map(p => p.development_area).filter(Boolean))] as string[];

  // Get existing areas
  const { data: existingAreas, error: areaError } = await supabase
    .from("project_areas")
    .select("name")
    .eq("project_id", projectId);

  if (areaError) {
    return { error: areaError.message };
  }

  const existingAreaNames = existingAreas?.map(a => a.name) || [];
  const missingAreas = uniqueAreasFromPros.filter(name => !existingAreaNames.includes(name));


  // Create missing areas
  if (missingAreas.length > 0) {
    const { data: newAreas, error: insertError } = await supabase
      .from("project_areas")
      .insert(missingAreas.map(name => ({ project_id: projectId, name })))
      .select();

    if (insertError) {
      return { error: insertError.message };
    }

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
  if (!user) return { error: "Non autorisÃ©" };

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
    return { error: error.message };
  }
  revalidatePath(`/projets/${projectId}`);
  return { data: updated };
}

export async function updateProjectArea(areaId: string, projectId: string, newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisÃ©" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accÃ¨s refusÃ©." };

  const { data, error } = await supabase
    .from("project_areas")
    .update({ name: newName })
    .eq("id", areaId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }
  revalidatePath(`/projets/${projectId}`);
  return { data };
}

export async function deleteProjectArea(areaId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisÃ©" };

  const { data: project } = await supabase
    .from("user_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accÃ¨s refusÃ©." };

  // FIRST: Delete all professionals associated with this area to ensure sync with /pros page
  const { error: proDeleteError, count: proCount } = await supabase
    .from("project_professionals")
    .delete()
    .eq("project_area_id", areaId);

  if (proDeleteError) {
    // We continue even if this fails, or should we abort? 
    // Usually it's better to keep the area if cleanup fails to avoid orphans.
    return { error: `Ã‰chec du nettoyage des professionnels: ${proDeleteError.message}` };
  }
  

  const { error } = await supabase
    .from("project_areas")
    .delete()
    .eq("id", areaId);

  if (error) {
    return { error: error.message };
  }

  
  revalidatePath(`/projets/${projectId}`);
  revalidatePath(`/projets/${projectId}/pros`); // Added sync for pros page
  return { success: true };
}

/**
 * Add a development area to user_projects.development_areas array
 */
export async function addProjectDevelopmentArea(projectId: string, area: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisÃ©" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, development_areas")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accÃ¨s refusÃ©." };

  const currentAreas = (project.development_areas as string[]) || [];
  
  // Don't add if already exists
  if (currentAreas.includes(area)) {
    return { success: true, data: currentAreas };
  }

  const newAreas = [...currentAreas, area];

  const { data, error } = await supabase
    .from("user_projects")
    .update({ development_areas: newAreas })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projets/${projectId}`);
  return { success: true, data: newAreas };
}

/**
 * Remove a development area from user_projects.development_areas array
 */
export async function removeProjectDevelopmentArea(projectId: string, area: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisÃ©" };

  // Verify project ownership
  const { data: project } = await supabase
    .from("user_projects")
    .select("id, development_areas")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return { error: "Projet introuvable ou accÃ¨s refusÃ©." };

  const currentAreas = (project.development_areas as string[]) || [];
  const newAreas = currentAreas.filter(a => a !== area);

  const { data, error } = await supabase
    .from("user_projects")
    .update({ development_areas: newAreas })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projets/${projectId}`);
  return { success: true, data: newAreas };
}
