"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
}

export async function getAdminProjects() {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return { data: data ?? [], error };
}

export async function updateAdminProject(id: string, updates: Record<string, unknown>) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("user_projects").update(updates).eq("id", id);
  return { error };
}
