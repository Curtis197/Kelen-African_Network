"use server";

import { createClient } from "@/lib/supabase/server";

export interface ExportProjectData {
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  budget: number | null;
  currency: string;
  client_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  steps: ExportStepData[];
  logs: ExportLogData[];
}

export interface ExportStepData {
  title: string;
  description: string | null;
  status: string;
  budget: number | null;
  expenditure: number | null;
  order_index: number;
  pros: string[];
}

export interface ExportLogData {
  log_date: string;
  title: string;
  description: string;
  money_spent: number;
  money_currency: string;
  issues: string | null;
  next_steps: string | null;
  status: string;
  author_role: string;
  photo_count: number;
}

export async function getProjectExportData(projectId: string): Promise<ExportProjectData | null> {
  const supabase = await createClient();

  // Get project info
  const { data: project } = await supabase
    .from("user_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  // Get project steps
  const { data: steps } = await supabase
    .from("project_steps")
    .select(`
      *,
      step_pros(
        professional:professionals(business_name)
      )
    `)
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  const formattedSteps: ExportStepData[] = (steps || []).map(step => ({
    title: step.title,
    description: step.description || null,
    status: step.status,
    budget: step.budget || null,
    expenditure: step.expenditure || null,
    order_index: step.order_index,
    pros: (step.step_pros || []).map(p => p.professional?.business_name || "Pro externe"),
  }));

  // Get project logs
  const { data: logs } = await supabase
    .from("project_logs")
    .select(`
      *,
      media:project_log_media(*)
    `)
    .eq("project_id", projectId)
    .order("log_date", { ascending: false });

  const formattedLogs: ExportLogData[] = (logs || []).map(log => ({
    log_date: log.log_date,
    title: log.title,
    description: log.description,
    money_spent: log.money_spent || 0,
    money_currency: log.money_currency || "XOF",
    issues: log.issues || null,
    next_steps: log.next_steps || null,
    status: log.status,
    author_role: log.author_role,
    photo_count: (log.media || []).length,
  }));

  return {
    title: project.title,
    description: project.description || null,
    category: project.category || null,
    location: project.location || null,
    budget: project.budget || null,
    currency: project.currency || "XOF",
    client_name: project.client_name || null,
    start_date: project.start_date || null,
    end_date: project.end_date || null,
    status: project.status,
    steps: formattedSteps,
    logs: formattedLogs,
  };
}
