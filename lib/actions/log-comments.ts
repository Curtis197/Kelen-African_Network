"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendLogActionEmail } from "@/lib/utils/email-notifications";
import { z } from "zod";
import { getProfessionalId } from "./daily-logs";

const logCommentSchema = z.object({
  logId: z.string().uuid("ID de rapport invalide"),
  comment: z.string().min(1, "Le commentaire ne peut pas être vide").max(5000, "Le commentaire est trop long (max 5000 caractères)"),
  evidenceUrls: z.array(z.string().url("URL invalide")).max(10, "Maximum 10 URLs autorisées").optional(),
});

/**
 * Helper to check if a user has authorization to approve/contest a log.
 * Returns { isAuthorized: boolean, error?: string }
 */
async function checkProjectAccess(
  supabase: any,
  user: any,
  logEntry: { project_id: string | null; pro_project_id: string | null }
): Promise<{ isAuthorized: boolean; error?: string }> {
  // 1. Check if it's a client project owner
  if (logEntry.project_id) {
    const { data: project, error: projectError } = await supabase
      .from("user_projects")
      .select("id")
      .eq("id", logEntry.project_id)
      .eq("user_id", user.id)
      .single();

    if (project) {
      return { isAuthorized: true };
    }
  }

  // 2. Check if it's a pro project owner
  if (logEntry.pro_project_id) {
    const proId = await getProfessionalId();

    if (proId) {
      const { data: proProject, error: proError } = await supabase
        .from("pro_projects")
        .select("id")
        .eq("id", logEntry.pro_project_id)
        .eq("professional_id", proId)
        .single();

      if (proProject) {
        return { isAuthorized: true };
      }
    }
  }

  // 3. Check if it's an assigned professional on a client project
  if (logEntry.project_id) {
    const proId = await getProfessionalId();
    if (proId) {
      // Check project_professionals (direct assignment)
      const { data: proAccess } = await supabase
        .from("project_professionals")
        .select("id")
        .eq("project_id", logEntry.project_id)
        .eq("professional_id", proId)
        .single();

      if (proAccess) {
        return { isAuthorized: true };
      }

      // Check project_collaborations (active status)
      const { data: collabAccess } = await supabase
        .from("project_collaborations")
        .select("id")
        .eq("project_id", logEntry.project_id)
        .eq("professional_id", proId)
        .eq("status", "active")
        .single();

      if (collabAccess) {
        return { isAuthorized: true };
      }
    }
  }

  return { isAuthorized: false, error: "Vous n'avez pas l'autorisation d'effectuer cette action sur ce rapport." };
}

export async function approveLog(
  logId: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = logCommentSchema.safeParse({ logId, comment });
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // Get log info
  const { data: logEntry, error: logFetchError } = await supabase
    .from("project_logs")
    .select("project_id, pro_project_id, status, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry) {
    return { success: false, error: "Rapport introuvable" };
  }

  // Verify authorization using helper
  const { isAuthorized, error: authError } = await checkProjectAccess(supabase, user, logEntry);
  if (!isAuthorized) {
    return { success: false, error: authError || "Non autorisé" };
  }

  // Insert comment
  const { error: commentError } = await supabase
    .from("project_log_comments")
    .insert([{
      log_id: logId,
      author_id: user.id,
      comment_type: 'approval',
      comment_text: comment,
    }]);

  if (commentError) {
    return { success: false, error: commentError.message };
  }

  // Update log status
  const { error: updateError } = await supabase
    .from("project_logs")
    .update({ status: 'approved' })
    .eq("id", logId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Send notification email to log author (optional, fails gracefully)
  try {
    const { data: logAuthor } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", logEntry.author_id)
      .single();

    const { data: commentingUser } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const commenterName = `${commentingUser?.first_name || ''} ${commentingUser?.last_name || ''}`.trim();

    if (logAuthor?.email) {
      await sendLogActionEmail({
        to: logAuthor.email,
        projectName: 'Projet',
        logTitle: 'Rapport',
        action: 'approved',
        comment,
        authorName: commenterName,
        logId,
        projectId: logEntry.project_id || logEntry.pro_project_id,
      });
    }
  } catch {
    // Email is optional — don't fail the action
  }

  // Revalidate the correct path based on project type
  if (logEntry.pro_project_id) {
    revalidatePath(`/pro/projets/${logEntry.pro_project_id}/journal`);
  } else if (logEntry.project_id) {
    revalidatePath(`/projets/${logEntry.project_id}/journal`);
  }

  return { success: true };
}

export async function contestLog(
  logId: string,
  comment: string,
  evidenceUrls: string[] = []
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = logCommentSchema.safeParse({ logId, comment, evidenceUrls });
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // Get log info
  const { data: logEntry, error: logFetchError } = await supabase
    .from("project_logs")
    .select("project_id, pro_project_id, status, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry) {
    return { success: false, error: "Rapport introuvable" };
  }

  // Verify authorization using helper
  const { isAuthorized, error: authError } = await checkProjectAccess(supabase, user, logEntry);
  if (!isAuthorized) {
    return { success: false, error: authError || "Non autorisé" };
  }

  // Insert comment
  const { error: commentError } = await supabase
    .from("project_log_comments")
    .insert([{
      log_id: logId,
      author_id: user.id,
      comment_type: 'contest',
      comment_text: comment,
      evidence_urls: evidenceUrls,
    }]);

  if (commentError) {
    return { success: false, error: commentError.message };
  }

  // Update log status
  const { error: updateError } = await supabase
    .from("project_logs")
    .update({ status: 'contested' })
    .eq("id", logId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Revalidate the correct path based on project type
  if (logEntry.pro_project_id) {
    revalidatePath(`/pro/projets/${logEntry.pro_project_id}/journal`);
  } else if (logEntry.project_id) {
    revalidatePath(`/projets/${logEntry.project_id}/journal`);
  }

  return { success: true };
}

export async function resolveLog(
  logId: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = logCommentSchema.safeParse({ logId, comment });
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // Get log info
  const { data: logEntry, error: logFetchError } = await supabase
    .from("project_logs")
    .select("project_id, pro_project_id, status, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry) {
    return { success: false, error: "Rapport introuvable" };
  }

  if (logEntry.status !== 'contested') {
    return { success: false, error: "Ce rapport n'est pas contesté" };
  }

  // Verify authorization using helper
  const { isAuthorized, error: authError } = await checkProjectAccess(supabase, user, logEntry);
  if (!isAuthorized) {
    return { success: false, error: authError || "Non autorisé" };
  }

  // Insert comment
  const { error: commentError } = await supabase
    .from("project_log_comments")
    .insert([{
      log_id: logId,
      author_id: user.id,
      comment_type: 'approval',
      comment_text: comment,
    }]);

  if (commentError) {
    return { success: false, error: commentError.message };
  }

  // Update log status
  const { error: updateError } = await supabase
    .from("project_logs")
    .update({ status: 'resolved' })
    .eq("id", logId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Revalidate the correct path based on project type
  if (logEntry.pro_project_id) {
    revalidatePath(`/pro/projets/${logEntry.pro_project_id}/journal`);
  } else if (logEntry.project_id) {
    revalidatePath(`/projets/${logEntry.project_id}/journal`);
  }

  return { success: true };
}

export async function getLogComments(logId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("project_log_comments")
    .select(`
      *,
      author:users(display_name, role)
    `)
    .eq("log_id", logId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}
