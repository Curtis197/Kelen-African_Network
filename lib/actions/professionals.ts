"use server";

import { createClient } from "@/lib/supabase/server";
import { Professional } from "@/lib/supabase/types";

export interface ProfessionalsData {
  professionals: Professional[];
  totalCount: number;
}

export interface ProfessionalsFilter {
  areaId?: string;
  professionId?: string;
  tier?: string;
  city?: string;
  country?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function getProfessionals(filter: ProfessionalsFilter = {}): Promise<ProfessionalsData> {
  console.log('[ACTION] getProfessionals started, filter:', filter);
  const supabase = await createClient();
  
  const { 
    areaId, 
    professionId, 
    tier, 
    city, 
    country, 
    query, 
    page = 1, 
    pageSize = 12 
  } = filter;

  let dbQuery = supabase
    .from("professionals")
    .select("*", { count: "exact" })
    .neq("status", "black");

  if (areaId) dbQuery = dbQuery.eq("area_id", areaId);
  if (professionId) dbQuery = dbQuery.eq("profession_id", professionId);
  if (tier && tier !== "Tous") {
    if (tier === "Or") dbQuery = dbQuery.eq("status", "gold");
    else if (tier === "Argent") dbQuery = dbQuery.eq("status", "silver");
  }
  
  if (city) dbQuery = dbQuery.ilike("city", `%${city}%`);
  if (country) dbQuery = dbQuery.ilike("country", `%${country}%`);
  
  if (query) {
    dbQuery = dbQuery.or(`business_name.ilike.%${query}%,owner_name.ilike.%${query}%`);
  }

  // Sorting
  dbQuery = dbQuery
    .order("status", { ascending: true }) // gold, silver, white...
    .order("recommendation_count", { ascending: false });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error } = await dbQuery;

  if (error) {
    console.error('[DB] Error fetching professionals:', { error: error.message, code: error.code });
    return { professionals: [], totalCount: 0 };
  }

  console.log('[DB] Results:', { count: data?.length, total: count });

  return {
    professionals: (data as Professional[]) || [],
    totalCount: count || 0
  };
}
