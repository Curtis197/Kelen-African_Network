"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProfessionalRecommandations(professionalId: string): Promise<Array<any>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recommandations:", error);
    return [];
  }

  return data || [];
}

export async function getLatestRecommandations(professionalId: string, limit: number = 5): Promise<Array<any>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("recommendations")
    .select("id, content, project_context, created_at")
    .eq("professional_id", professionalId)
    .eq("status", "verified")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching latest recommandations:", error);
    return [];
  }

  return data || [];
}

export async function getRecommandationCount(professionalId: string): Promise<number> {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from("recommendations")
    .select("*", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .eq("status", "verified");

  if (error) {
    console.error("Error counting recommandations:", error);
    return 0;
  }

  return count || 0;
}
