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
  console.log('[RECOMMANDATIONS] Fetching latest for professional:', professionalId, 'limit:', limit);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recommendations")
    .select("id, project_description, project_type, submitter_name, submitter_country, created_at")
    .eq("professional_id", professionalId)
    .eq("status", "verified")
    .order("created_at", { ascending: false })
    .limit(limit);

  console.log('[RECOMMANDATIONS] Result:', { count: data?.length || 0, error: error?.message, code: error?.code });
  
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on recommendations!');
    console.error('[RLS] Table: recommendations');
    console.error('[RLS] Professional ID:', professionalId);
    console.error('[RLS] Fix: Add RLS policy for recommendations table allowing SELECT for authenticated users');
  }
  
  if (!error && data?.length === 0) {
    console.warn('[RLS] ⚠️ SILENT RLS FILTERING on recommendations!');
    console.warn('[RLS] Query succeeded but 0 rows returned - RLS may be filtering all results');
    console.warn('[RLS] Professional ID:', professionalId);
    console.warn('[RLS] Fix: Check RLS policies on recommendations table');
  }

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
