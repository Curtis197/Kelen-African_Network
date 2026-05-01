"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProfessionalArea, Profession } from "@/lib/types/taxonomy";

export async function getAreas(): Promise<ProfessionalArea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professional_areas")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching areas:", error);
    return [];
  }
  return data as ProfessionalArea[];
}

export async function getProfessionsByArea(areaId: string): Promise<Profession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professions")
    .select("*")
    .eq("area_id", areaId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching professions:", error);
    return [];
  }
  return data as Profession[];
}

export async function getAllProfessions(): Promise<Profession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professions")
    .select("*, area:professional_areas(id, name, slug, sort_order)")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching professions:", error);
    return [];
  }
  return data as Profession[];
}

export type AreaWithCount = ProfessionalArea & { professionalCount: number };

export async function getAreasSortedByPopularity(
  options?: { all?: boolean }
): Promise<AreaWithCount[]> {
  const supabase = await createClient();

  const [{ data: areas, error: areasError }, { data: counts, error: countsError }] = await Promise.all([
    supabase.from("professional_areas").select("*"),
    supabase.from("professionals").select("area_id").neq("status", "black"),
  ]);

  if (areasError) {
    console.error("Error fetching areas:", areasError);
    return [];
  }
  if (countsError) {
    console.error("Error fetching professional counts:", countsError);
  }

  if (!areas) return [];

  const countMap = (counts || []).reduce<Record<string, number>>((acc, row) => {
    if (row.area_id) acc[row.area_id] = (acc[row.area_id] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = areas
    .map((area) => ({ ...area, professionalCount: countMap[area.id] ?? 0 }))
    .sort((a, b) =>
      b.professionalCount - a.professionalCount ||
      a.sort_order - b.sort_order
    );

  return options?.all ? sorted : sorted.slice(0, 6);
}

// Admin actions

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "Vous devez être connecté" as string };
  }

  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || !userData || userData.role !== 'admin') {
    return { error: "Non autorisé: accès admin requis" as string };
  }

  return { success: true };
}

export async function createArea(name: string, slug: string) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) return adminCheck;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("professional_areas").select("id").order("sort_order", { ascending: false }).limit(1).single();
  const nextOrder = (existing as any)?.sort_order ? (existing as any).sort_order + 1 : 1;

  const { data, error } = await supabase
    .from("professional_areas")
    .insert([{ name, slug, sort_order: nextOrder }])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { data };
}

export async function updateArea(id: string, name: string, slug: string) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) return adminCheck;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professional_areas")
    .update({ name, slug })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { data };
}

export async function deleteArea(id: string) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) return adminCheck;

  const supabase = await createClient();
  const { error } = await supabase.from("professional_areas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { success: true };
}

export async function createProfession(areaId: string, name: string, slug: string) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) return adminCheck;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("professions").select("sort_order").eq("area_id", areaId).order("sort_order", { ascending: false }).limit(1).single();
  const nextOrder = (existing as any)?.sort_order ? (existing as any).sort_order + 1 : 1;

  const { data, error } = await supabase
    .from("professions")
    .insert([{ area_id: areaId, name, slug, sort_order: nextOrder }])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { data };
}

export async function updateProfession(id: string, name: string, slug: string) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) return adminCheck;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professions")
    .update({ name, slug })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { data };
}

export async function deleteProfession(id: string) {
  const adminCheck = await requireAdmin();
  if ('error' in adminCheck) return adminCheck;

  const supabase = await createClient();
  const { error } = await supabase.from("professions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { success: true };
}
