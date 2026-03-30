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

// Admin actions

export async function createArea(name: string, slug: string) {
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
  const supabase = await createClient();
  const { error } = await supabase.from("professional_areas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { success: true };
}

export async function createProfession(areaId: string, name: string, slug: string) {
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
  const supabase = await createClient();
  const { error } = await supabase.from("professions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/taxonomy");
  return { success: true };
}
