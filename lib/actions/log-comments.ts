"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendLogActionEmail } from "@/lib/utils/email-notifications";

export async function approveLog(
  logId: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // Get log info - include pro_project_id
  const { data: logEntry } = await supabase
    .from("project_logs")
    .select("project_id, pro_project_id, status, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry) return { success: false, error: "Rapport introuvable" };

  // Verify ownership - check both client projects and pro projects
  let isAuthorized = false;
  let projectId = logEntry.project_id;

  // Check if it's a client project
  if (logEntry.project_id) {
    const { data: project } = await supabase
      .from("user_projects")
      .select("id")
      .eq("id", logEntry.project_id)
      .eq("user_id", user.id)
      .single();
    
    if (project) {
      isAuthorized = true;
    }
  }

  // Check if it's a pro project
  if (logEntry.pro_project_id && !isAuthorized) {
    const { data: professional } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    if (professional) {
      const { data: proProject } = await supabase
        .from("pro_projects")
        .select("id")
        .eq("id", logEntry.pro_project_id)
        .eq("professional_id", professional.id)
        .single();
      
      if (proProject) {
        isAuthorized = true;
        projectId = logEntry.pro_project_id; // Use pro_project_id for revalidation
      }
    }
  }

  if (!isAuthorized) {
    return { success: false, error: "Non autorisé" };
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // Get log info - include pro_project_id
  const { data: logEntry } = await supabase
    .from("project_logs")
    .select("project_id, pro_project_id, status, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry) return { success: false, error: "Rapport introuvable" };

  // Verify ownership - check both client projects and pro projects
  let isAuthorized = false;

  // Check if it's a client project
  if (logEntry.project_id) {
    const { data: project } = await supabase
      .from("user_projects")
      .select("id")
      .eq("id", logEntry.project_id)
      .eq("user_id", user.id)
      .single();
    
    if (project) {
      isAuthorized = true;
    }
  }

  // Check if it's a pro project
  if (logEntry.pro_project_id && !isAuthorized) {
    const { data: professional } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    if (professional) {
      const { data: proProject } = await supabase
        .from("pro_projects")
        .select("id")
        .eq("id", logEntry.pro_project_id)
        .eq("professional_id", professional.id)
        .single();
      
      if (proProject) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return { success: false, error: "Non autorisé" };
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // Get log info - include pro_project_id
  const { data: logEntry } = await supabase
    .from("project_logs")
    .select("project_id, pro_project_id, status, author_id")
    .eq("id", logId)
    .single();

  if (!logEntry) return { success: false, error: "Rapport introuvable" };
  if (logEntry.status !== 'contested') {
    return { success: false, error: "Ce rapport n'est pas contesté" };
  }

  // Verify ownership - check both client projects and pro projects
  let isAuthorized = false;

  // Check if it's a client project
  if (logEntry.project_id) {
    const { data: project } = await supabase
      .from("user_projects")
      .select("id")
      .eq("id", logEntry.project_id)
      .eq("user_id", user.id)
      .single();
    
    if (project) {
      isAuthorized = true;
    }
  }

  // Check if it's a pro project
  if (logEntry.pro_project_id && !isAuthorized) {
    const { data: professional } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    if (professional) {
      const { data: proProject } = await supabase
        .from("pro_projects")
        .select("id")
        .eq("id", logEntry.pro_project_id)
        .eq("professional_id", professional.id)
        .single();
      
      if (proProject) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return { success: false, error: "Non autorisé" };
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

  const { data, error } = await supabase
    .from("project_log_comments")
    .select(`
      *,
      author:users(first_name, last_name, role)
    `)
    .eq("log_id", logId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching log comments:", error);
    return [];
  }

  return data || [];
}
