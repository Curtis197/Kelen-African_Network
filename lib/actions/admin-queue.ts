"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");
  return user;
}

export async function approveQueueItem(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string | null;

  const supabase = createServiceClient();

  const { data: item } = await supabase
    .from("verification_queue")
    .select("item_type, item_id")
    .eq("id", id)
    .single();

  if (!item) return;

  await supabase
    .from("verification_queue")
    .update({ status: "approved", admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  const table = item.item_type === "recommendation" ? "recommendations" : "signals";
  await supabase
    .from(table)
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("id", item.item_id);

  revalidatePath("/admin/queue");
  redirect("/admin/queue");
}

export async function requestMoreInfo(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string | null;

  const supabase = createServiceClient();

  await supabase
    .from("verification_queue")
    .update({ status: "info_requested", admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/queue");
  redirect("/admin/queue");
}

export async function rejectQueueItem(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string | null;

  const supabase = createServiceClient();

  await supabase
    .from("verification_queue")
    .update({ status: "rejected", admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/queue");
  redirect("/admin/queue");
}
