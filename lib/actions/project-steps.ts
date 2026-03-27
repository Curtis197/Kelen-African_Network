"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const stepSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  title: z.string().min(1, "Le titre est requis"),
  comment: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('pending'), // Assuming these are the correct status keys as per the original schema
  budget: z.number().default(0),
  expenditure: z.number().default(0),
  order_index: z.number().default(0),
});

export async function getProjectSteps(projectId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("project_steps")
    .select(`
      *,
      project_step_professionals (
        project_professional_id,
        project_professionals (
          id,
          is_external,
          external_name,
          professionals (
            business_name
          )
        )
      )
    `)
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching project steps:", error);
    return [];
  }

  return data.map(step => ({
    ...step,
    associated_pros: step.project_step_professionals.map((psp: any) => {
      const pro = psp.project_professionals;
      return pro.is_external ? pro.external_name : pro.professionals?.business_name;
    }).filter(Boolean)
  }));
}

export async function upsertProjectStep(data: z.infer<typeof stepSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Non autorisé");

  const validatedData = stepSchema.parse(data);
  const stepId = validatedData.id;
  const stepFields = { ...validatedData };
  delete stepFields.id;

  if (stepId) {
    const { data: updated, error } = await supabase
      .from("project_steps")
      .update(stepFields)
      .eq("id", stepId)
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath(`/projets/${validatedData.project_id}`);
    return { data: updated };
  } else {
    const { data: created, error } = await supabase
      .from("project_steps")
      .insert([stepFields])
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath(`/projets/${validatedData.project_id}`);
    return { data: created };
  }
}

export async function deleteProjectStep(stepId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_steps")
    .delete()
    .eq("id", stepId);

  if (error) return { error: error.message };
  
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}

export async function manageStepProfessional(
  stepId: string,
  projectProfessionalId: string,
  action: 'add' | 'remove',
  projectId: string
) {
  const supabase = await createClient();
  
  if (action === 'add') {
    const { error } = await supabase
      .from("project_step_professionals")
      .insert([{
        step_id: stepId,
        project_professional_id: projectProfessionalId
      }]);
      
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("project_step_professionals")
      .delete()
      .eq("step_id", stepId)
      .eq("project_professional_id", projectProfessionalId);
      
    if (error) return { error: error.message };
  }
  
  revalidatePath(`/projets/${projectId}`);
  return { success: true };
}
