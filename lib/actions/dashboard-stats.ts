"use server";

import { createClient } from "@/lib/supabase/server";

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

export interface DashboardStats {
  professionalId: string | null;
  businessName: string | null;
  status: string | null;
  recommendationCount: number;
  signalCount: number;
  avgRating: number;
  reviewCount: number;
  monthlyViews: number;
  subscriptionStatus: string;
  pendingRecommendations: number;
  pendingSignals: number;
  // Google Business Profile
  gbp: {
    isConnected: boolean;
    verificationStatus: string | null;
    lastSyncedAt: string | null;
    gbpLocationName: string | null;
    gbpPlaceId: string | null;
  };
}

export async function getProDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emptyGbp = {
    isConnected: false,
    verificationStatus: null,
    lastSyncedAt: null,
    gbpLocationName: null,
    gbpPlaceId: null,
  };

  if (!user) {
    return {
      professionalId: null,
      businessName: null,
      status: null,
      recommendationCount: 0,
      signalCount: 0,
      avgRating: 0,
      reviewCount: 0,
      monthlyViews: 0,
      subscriptionStatus: "Gratuit",
      pendingRecommendations: 0,
      pendingSignals: 0,
      gbp: emptyGbp,
    };
  }

  // Get professional profile
  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, status, avg_rating, review_count")
    .eq("user_id", user.id)
    .single();

  if (!pro) {
    return {
      professionalId: null,
      businessName: null,
      status: null,
      recommendationCount: 0,
      signalCount: 0,
      avgRating: 0,
      reviewCount: 0,
      monthlyViews: 0,
      subscriptionStatus: "Gratuit",
      pendingRecommendations: 0,
      pendingSignals: 0,
      gbp: emptyGbp,
    };
  }


  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { count: recommendationCount },
    { count: signalCount },
    { count: monthlyViews },
    { data: subscription },
    { count: pendingRecommendations },
    { count: pendingSignals },
    { data: gbpTokens }
  ] = await Promise.all([
    // Count recommendations
    supabase.from("recommendations").select("*", { count: "exact", head: true }).eq("professional_id", pro.id),
    // Count signals
    supabase.from("signals").select("*", { count: "exact", head: true }).eq("professional_id", pro.id),
    // Monthly views (last 30 days)
    supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("professional_id", pro.id).gte("created_at", thirtyDaysAgo.toISOString()),
    // Subscription status
    supabase.from("subscriptions").select("status").eq("professional_id", pro.id).single(),
    // Pending items
    supabase.from("recommendations").select("*", { count: "exact", head: true }).eq("professional_id", pro.id).eq("status", "pending"),
    supabase.from("signals").select("*", { count: "exact", head: true }).eq("professional_id", pro.id).eq("status", "pending"),
    // Google Business Profile connection status
    supabase.from("pro_google_tokens").select("access_token, verification_status, last_synced_at, gbp_location_name, gbp_place_id").eq("pro_id", pro.id).single()
  ]);

  const avgRating = pro.avg_rating || 0;
  const reviewCount = pro.review_count || 0;

  const subscriptionStatus = subscription?.status === "active" ? "Premium" : "Gratuit";

  const gbp = {
    isConnected: !!gbpTokens?.access_token,
    verificationStatus: gbpTokens?.verification_status || null,
    lastSyncedAt: gbpTokens?.last_synced_at || null,
    gbpLocationName: gbpTokens?.gbp_location_name || null,
    gbpPlaceId: gbpTokens?.gbp_place_id || null,
  };

  return {
    professionalId: pro.id,
    businessName: pro.business_name,
    status: pro.status,
    recommendationCount: recommendationCount || 0,
    signalCount: signalCount || 0,
    avgRating,
    reviewCount,
    monthlyViews: monthlyViews || 0,
    subscriptionStatus,
    pendingRecommendations: pendingRecommendations || 0,
    pendingSignals: pendingSignals || 0,
    gbp,
  };
}
