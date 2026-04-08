"use server";

import { createClient } from "@/lib/supabase/server";

export interface JournalStats {
  logCount: number;
  totalSpent: number;
  currency: string;
  photoCount: number;
  daysWorked: number;
}

export async function getProjectJournalStats(projectId: string, isProProject = false): Promise<JournalStats> {
  const supabase = await createClient();

  const idField = isProProject ? "pro_project_id" : "project_id";

  // Count logs
  const { data: logs } = await supabase
    .from("project_logs")
    .select("id, log_date, money_spent, money_currency")
    .eq(idField, projectId);

  if (!logs || logs.length === 0) {
    return { logCount: 0, totalSpent: 0, currency: "XOF", photoCount: 0, daysWorked: 0 };
  }

  // Sum money spent
  const totalSpent = logs.reduce((sum, log) => sum + (log.money_spent || 0), 0);
  const currency = logs[0]?.money_currency || "XOF";

  // Count unique dates (days worked)
  const uniqueDates = new Set(logs.map(log => log.log_date));

  // Count photos
  const { count: photoCount } = await supabase
    .from("project_log_media")
    .select("*", { count: "exact", head: true })
    .in(
      "log_id",
      logs.map(log => log.id)
    );

  return {
    logCount: logs.length,
    totalSpent,
    currency,
    photoCount: photoCount || 0,
    daysWorked: uniqueDates.size,
  };
}
