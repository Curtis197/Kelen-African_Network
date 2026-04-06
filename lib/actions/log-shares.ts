"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { ShareStats, SharedLogData } from "@/lib/types/daily-logs";

export async function shareLog(
  logId: string,
  options: {
    method: 'email' | 'whatsapp' | 'sms';
    recipientEmail?: string;
    recipientPhone?: string;
  }
): Promise<{ shareToken: string; shareUrl: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { shareToken: '', shareUrl: '', error: "Non autorisé" };

  // Generate token
  const shareToken = crypto.randomBytes(24).toString('hex'); // 48-char hex string
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';
  const shareUrl = `${baseUrl}/journal/${shareToken}`;

  // Save share record
  const { error } = await supabase
    .from("project_log_shares")
    .insert([{
      log_id: logId,
      share_token: shareToken,
      recipient_email: options.recipientEmail || null,
      recipient_phone: options.recipientPhone || null,
      share_method: options.method,
      shared_by_id: user.id,
    }]);

  if (error) {
    return { shareToken: '', shareUrl: '', error: error.message };
  }

  // TODO: Send email notification via Resend if method === 'email'
  // This will be implemented when we wire up notifications

  return { shareToken, shareUrl };
}

export async function getSharedLogByToken(shareToken: string): Promise<SharedLogData | null> {
  const supabase = await createClient();

  // Get share info
  const { data: share, error: shareError } = await supabase
    .from("project_log_shares")
    .select(`
      *,
      log:project_logs(
        *,
        media:project_log_media(*)
      )
    `)
    .eq("share_token", shareToken)
    .single();

  if (shareError || !share?.log) {
    return null;
  }

  // Get project info
  const { data: project } = await supabase
    .from("user_projects")
    .select("title, location")
    .eq("id", (share.log as any).project_id)
    .single();

  return {
    log: share.log,
    projectName: project?.title || 'Projet',
    projectLocation: project?.location || null,
    projectLocationLat: null,
    projectLocationLng: null,
    shareInfo: share,
  };
}

export async function recordShareView(
  shareToken: string,
  ip: string | null,
  userAgent: string | null
): Promise<void> {
  const supabase = await createClient();

  // Get share ID
  const { data: share } = await supabase
    .from("project_log_shares")
    .select("id, first_viewed_at, view_count")
    .eq("share_token", shareToken)
    .single();

  if (!share) return;

  // Record view
  await supabase
    .from("project_log_views")
    .insert([{
      share_id: share.id,
      viewer_ip: ip,
      viewer_user_agent: userAgent,
    }]);

  // Update share stats
  const isFirstView = !share.first_viewed_at;
  await supabase
    .from("project_log_shares")
    .update({
      first_viewed_at: isFirstView ? new Date().toISOString() : share.first_viewed_at,
      view_count: share.view_count + 1,
    })
    .eq("id", share.id);
}

export async function getShareStats(logId: string): Promise<ShareStats> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("project_log_shares")
    .select("first_viewed_at, view_count")
    .eq("log_id", logId)
    .order("view_count", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return { viewCount: 0, firstViewedAt: null };
  }

  return {
    viewCount: data.view_count,
    firstViewedAt: data.first_viewed_at,
  };
}

export async function getShareUrl(logId: string): Promise<string | null> {
  const supabase = await createClient();

  // Check if there's an existing active share
  const { data: existingShare } = await supabase
    .from("project_log_shares")
    .select("share_token")
    .eq("log_id", logId)
    .order("shared_at", { ascending: false })
    .limit(1)
    .single();

  if (existingShare) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';
    return `${baseUrl}/journal/${existingShare.share_token}`;
  }

  return null;
}
