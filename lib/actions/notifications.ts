"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type NotificationType =
  | "log_created" | "log_approved" | "log_contested" | "log_resolved"
  | "project_assigned" | "new_recommendation" | "new_signal"
  | "status_changed" | "subscription_activated" | "subscription_expired"
  | "finalist_selected" | "proposal_submitted" | "revision_requested"
  | "proposal_accepted" | "proposal_declined" | "collaboration_declined"
  | "collaboration_activated" | "collaboration_terminated";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Internal use only — bypasses caller auth check.
 * Use this from server actions that need to notify another user (e.g. collaboration events).
 * Never call from client code.
 */
export async function insertNotification(input: CreateNotificationInput): Promise<{ id?: string; error?: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert([{
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
      icon: input.icon || "bell",
      metadata: input.metadata || {},
    }])
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

/**
 * Create a notification for a user.
 * Can be called from server actions, triggers, or background jobs.
 * Requires authentication to prevent spam.
 */
export async function createNotification(input: CreateNotificationInput): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();

  // Require authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Non autorisé" };
  }

  // Allow system notifications (when userId matches authenticated user or is from admin)
  if (input.userId !== user.id) {
    // Check if user is admin (authorized to send notifications to others)
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== 'admin') {
      return { error: "Non autorisé: impossible de notifier un autre utilisateur" };
    }
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert([{
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
      icon: input.icon || "bell",
      metadata: input.metadata || {},
    }])
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id };
}

/**
 * Get unread notification count for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

/**
 * Get notifications for the current user with pagination.
 */
export async function getNotifications(limit = 20, offset = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/pro/dashboard");
  return {};
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };

  revalidatePath("/pro/dashboard");
  return {};
}

/**
 * Delete old notifications (cleanup job).
 * Admin-only.
 */
export async function deleteOldNotifications(olderThanDays = 30): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0, error: "Non autorisé" };

  // Verify admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { count: 0, error: "Accès refusé" };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { error, count } = await supabase
    .from("notifications")
    .delete()
    .lt("created_at", cutoffDate.toISOString());

  if (error) return { count: 0, error: error.message };

  return { count: count || 0 };
}
