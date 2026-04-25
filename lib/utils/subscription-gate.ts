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
 * DEV MODE: always returns PAID_LIMITS — remove before production
 */
export async function getTierLimits(): Promise<TierLimits> {
  return PAID_LIMITS;
}

/**
 * Check if the professional can create a new project.
 * DEV MODE: always allowed — remove before production
 */
export async function canCreateProject(): Promise<{ allowed: boolean; current: number; limit: number }> {
  return { allowed: true, current: 0, limit: -1 };
}

/**
 * Check if the professional can upload more photos.
 * DEV MODE: always allowed — remove before production
 */
export async function canUploadPhotos(_count: number): Promise<{ allowed: boolean; current: number; limit: number }> {
  return { allowed: true, current: 0, limit: -1 };
}
