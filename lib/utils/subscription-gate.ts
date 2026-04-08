import { createClient } from "@/lib/supabase/server";

export interface TierLimits {
  maxProjects: number;
  maxPhotos: number;
  hasVideo: boolean;
  hasSSR: boolean;
  hasSEO: boolean;
  hasBranding: boolean;
  hasAnalytics: boolean;
}

const FREE_LIMITS: TierLimits = {
  maxProjects: 3,
  maxPhotos: 15,
  hasVideo: false,
  hasSSR: false,
  hasSEO: false,
  hasBranding: false,
  hasAnalytics: false,
};

const PAID_LIMITS: TierLimits = {
  maxProjects: Infinity,
  maxPhotos: Infinity,
  hasVideo: true,
  hasSSR: true,
  hasSEO: true,
  hasBranding: true,
  hasAnalytics: true,
};

/**
 * Get the current professional's subscription limits.
 */
export async function getTierLimits(): Promise<TierLimits> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return FREE_LIMITS;

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return FREE_LIMITS;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("professional_id", pro.id)
    .single();

  return sub?.status === "active" ? PAID_LIMITS : FREE_LIMITS;
}

/**
 * Check if the professional can create a new project.
 */
export async function canCreateProject(): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: true, current: 0, limit: 3 };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { allowed: true, current: 0, limit: 3 };

  // Count projects
  const { count } = await supabase
    .from("pro_projects")
    .select("*", { count: "exact", head: true })
    .eq("professional_id", pro.id);

  const currentCount = count || 0;

  // Check subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("professional_id", pro.id)
    .single();

  const limit = sub?.status === "active" ? Infinity : 3;

  return {
    allowed: currentCount < limit,
    current: currentCount,
    limit: limit === Infinity ? -1 : limit, // -1 means unlimited
  };
}

/**
 * Check if the professional can upload more photos.
 */
export async function canUploadPhotos(count: number): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: true, current: 0, limit: 15 };

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { allowed: true, current: 0, limit: 15 };

  // Count portfolio photos (stored as array in professionals table)
  const { data } = await supabase
    .from("professionals")
    .select("portfolio_photos")
    .eq("id", pro.id)
    .single();

  const currentCount = (data?.portfolio_photos || []).length;

  // Check subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("professional_id", pro.id)
    .single();

  const limit = sub?.status === "active" ? Infinity : 15;

  return {
    allowed: currentCount + count <= limit,
    current: currentCount,
    limit: limit === Infinity ? -1 : limit,
  };
}
