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
      console.error("Error updating project:", error);
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
      console.error("Error creating project:", error);
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
  const { error } = await supabase
    .from("user_projects")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Error updating project status:", error);
    return { error: error.message };
  }

  revalidatePath(`/projets/${id}`);
}

export async function getProject(id: string) {
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

export async function getProjectPayments(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_payments")
    .select("*")
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching project payments:", error);
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
  externalData?: { name?: string; phone?: string; category?: string; location?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autorisé");

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
    } else {
      insertData.professional_id = proId;
    }

    const { error } = await supabase
      .from("project_professionals")
      .insert([insertData]);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("project_professionals")
      .delete()
      .eq("project_id", projectId)
      .eq(isExternal ? "external_name" : "professional_id", isExternal ? externalData?.name : proId)
      .eq("development_area", area);

    if (error) return { error: error.message };
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

  if (error) return { error: error.message };
  
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}

export async function updateProfessionalSelection(projectId: string, linkId: string, status: 'candidate' | 'shortlisted' | 'finalist') {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_professionals")
    .update({ selection_status: status })
    .eq("id", linkId);

  if (error) return { error: error.message };
  
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}
