"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ProjectLog, LogFormData } from "@/lib/types/daily-logs";

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

const logSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string().uuid(),
  isProProject: z.boolean().optional().default(false),
  stepId: z.string().uuid().nullable().optional(),
  logDate: z.string(),
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().min(50, "La description doit contenir au moins 50 caractères"),
  moneySpent: z.number().min(0).default(0),
  moneyCurrency: z.enum(["XOF", "EUR", "USD"]).default("XOF"),
  paymentId: z.string().uuid().nullable().optional(),
  issues: z.string().max(1000).nullable().optional(),
  nextSteps: z.string().max(1000).nullable().optional(),
  weather: z.enum(["sunny", "cloudy", "rainy", "stormy", "cold"]).nullable().optional(),
  gpsLatitude: z.number().min(-90).max(90),
  gpsLongitude: z.number().min(-180).max(180),
});

export async function createLog(data: z.infer<typeof logSchema>): Promise<{ data?: ProjectLog; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorisé" };
  }

  const validated = logSchema.parse(data);

  // Determine author role and project access
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const authorRole = profile?.role === 'pro_africa' || profile?.role === 'pro_europe' ? 'professional' : 'client';

  let targetProjectId: string;

  if (validated.isProProject) {
    // Pro-owned project
    const proId = await getProfessionalId();
    if (!proId) return { error: "Professionnel introuvable" };

    const { data: proProject } = await supabase
      .from("pro_projects")
      .select("id")
      .eq("id", validated.projectId)
      .eq("professional_id", proId)
      .single();

    if (!proProject) return { error: "Projet introuvable" };
    targetProjectId = validated.projectId;
  } else {
    // Client-owned project
    const { data: project } = await supabase
      .from("user_projects")
      .select("id")
      .eq("id", validated.projectId)
      .single();

    if (!project) return { error: "Projet introuvable" };
    targetProjectId = validated.projectId;
  }

  // For pro projects, we don't need to verify client access
  if (!validated.isProProject && authorRole === 'professional') {
    // Verify professional has access to client project
    const proId = await getProfessionalId();
    const { data: proAccess } = await supabase
      .from("project_professionals")
      .select("id")
      .eq("project_id", validated.projectId)
      .eq("professional_id", proId)
      .single();

    if (!proAccess) {
      return { error: "Vous n'avez pas accès à ce projet" };
    }
  }

  const insertData: Record<string, unknown> = {
    project_id: targetProjectId,
    step_id: validated.stepId || null,
    author_id: user.id,
    author_role: authorRole,
    log_date: validated.logDate,
    title: validated.title,
    description: validated.description,
    money_spent: validated.moneySpent,
    money_currency: validated.moneyCurrency,
    payment_id: validated.paymentId || null,
    issues: validated.issues || null,
    next_steps: validated.nextSteps || null,
    weather: validated.weather || null,
    gps_latitude: validated.gpsLatitude,
    gps_longitude: validated.gpsLongitude,
  };

  // For pro projects, set pro_project_id instead
  if (validated.isProProject) {
    insertData.pro_project_id = validated.projectId;
  }

  const { data: newLog, error } = await supabase
    .from("project_logs")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    log("log.create.error", { userId: user.id, projectId: validated.projectId, error: error.message });
    return { error: error.message };
  }

  log("log.create.ok", { userId: user.id, projectId: validated.projectId, logId: newLog.id, isProProject: validated.isProProject });
  
  if (validated.isProProject) {
    revalidatePath(`/pro/projets/${validated.projectId}/journal`);
  } else {
    revalidatePath(`/projets/${validated.projectId}/journal`);
  }
  return { data: newLog };
}

export async function updateLog(
  logId: string,
  data: Partial<LogFormData>
): Promise<{ data?: ProjectLog; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorisé" };

  // Verify ownership
  const { data: existingLog } = await supabase
    .from("project_logs")
    .select("*")
    .eq("id", logId)
    .single();

  if (!existingLog || existingLog.author_id !== user.id) {
    return { error: "Non autorisé" };
  }

  const updateData: Record<string, unknown> = {};
  if (data.logDate) updateData.log_date = data.logDate;
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.moneySpent !== undefined) updateData.money_spent = data.moneySpent;
  if (data.moneyCurrency) updateData.money_currency = data.moneyCurrency;
  if (data.paymentId !== undefined) updateData.payment_id = data.paymentId;
  if (data.issues !== undefined) updateData.issues = data.issues;
  if (data.nextSteps !== undefined) updateData.next_steps = data.nextSteps;
  if (data.weather !== undefined) updateData.weather = data.weather;
  if (data.gpsLatitude) updateData.gps_latitude = data.gpsLatitude;
  if (data.gpsLongitude) updateData.gps_longitude = data.gpsLongitude;

  const { data: updatedLog, error } = await supabase
    .from("project_logs")
    .update(updateData)
    .eq("id", logId)
    .select()
    .single();

  if (error) {
    log("log.update.error", { logId, error: error.message });
    return { error: error.message };
  }

  log("log.update.ok", { logId });
  
  // Revalidate the correct path based on project type
  if (existingLog.pro_project_id) {
    revalidatePath(`/pro/projets/${existingLog.pro_project_id}/journal`);
  } else if (existingLog.project_id) {
    revalidatePath(`/projets/${existingLog.project_id}/journal`);
  }
  
  return { data: updatedLog };
}

export async function deleteLog(logId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  const { data: existingLog } = await supabase
    .from("project_logs")
    .select("project_id, pro_project_id, author_id")
    .eq("id", logId)
    .single();

  if (!existingLog || existingLog.author_id !== user.id) {
    return { success: false, error: "Non autorisé" };
  }

  const { error } = await supabase
    .from("project_logs")
    .delete()
    .eq("id", logId);

  if (error) {
    log("log.delete.error", { logId, error: error.message });
    return { success: false, error: error.message };
  }

  log("log.delete.ok", { logId });
  
  // Revalidate the correct path based on project type
  if (existingLog.pro_project_id) {
    revalidatePath(`/pro/projets/${existingLog.pro_project_id}/journal`);
  } else if (existingLog.project_id) {
    revalidatePath(`/projets/${existingLog.project_id}/journal`);
  }
  
  return { success: true };
}

export async function getProjectLogs(projectId: string): Promise<ProjectLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_logs")
    .select(`
      *,
      media:project_log_media(*),
      comments:project_log_comments(*)
    `)
    .eq("project_id", projectId)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project logs:", error);
    return [];
  }

  return data || [];
}

export async function getLogById(logId: string, projectId?: string): Promise<ProjectLog | null> {
  const supabase = await createClient();

  let query = supabase
    .from("project_logs")
    .select(`
      *,
      media:project_log_media(*),
      comments:project_log_comments(
        *,
        author:users(first_name, last_name)
      )
    `)
    .eq("id", logId);

  // Filter by project if provided to satisfy RLS
  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error("Error fetching log:", error);
    return null;
  }

  return data;
}

export async function getLogsByStep(stepId: string): Promise<ProjectLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_logs")
    .select("*")
    .eq("step_id", stepId)
    .order("log_date", { ascending: false });

  if (error) {
    console.error("Error fetching logs by step:", error);
    return [];
  }

  return data || [];
}
