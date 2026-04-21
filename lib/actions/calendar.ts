"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { WorkingHours } from "@/lib/google-calendar";

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

export async function getCalendarSettings() {
  const supabase = await createClient();
  const proId = await getProfessionalId();
  if (!proId) return null;

  const { data } = await supabase
    .from("pro_calendar_tokens")
    .select("google_email, slot_duration, buffer_time, advance_days, working_hours, connected_at")
    .eq("pro_id", proId)
    .single();

  return data || null;
}

export async function updateCalendarSettings(settings: {
  slot_duration?: number;
  buffer_time?: number;
  advance_days?: number;
  working_hours?: WorkingHours;
}) {
  const supabase = await createClient();
  const proId = await getProfessionalId();
  if (!proId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("pro_calendar_tokens")
    .update(settings)
    .eq("pro_id", proId);

  if (error) throw new Error(error.message);
  revalidatePath("/pro/site");
}

export async function disconnectCalendar() {
  const supabase = await createClient();
  const proId = await getProfessionalId();
  if (!proId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("pro_calendar_tokens")
    .delete()
    .eq("pro_id", proId);

  if (error) throw new Error(error.message);
  revalidatePath("/pro/site");
}
