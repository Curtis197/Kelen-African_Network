import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";
import { gbpLog } from "@/lib/logger";

/**
 * GET /api/google/reviews
 * Optional query parameter: ?refresh=1 to forcefully fetch from Google.
 * 
 * Fetches Google reviews for the logged-in professional.
 */
export async function GET(request: NextRequest) {
  const log = gbpLog.child("reviews");
  log.info("→ GET /api/google/reviews");

  try {
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get("refresh") === "1";

    const supabase = await createClient();

    // Auth guard
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      log.warn("Unauthorized request", { authError: authErr?.message });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.debug("Session verified", { userId: user.id });

    // Ownership check & Pro fetching
    const { data: pro, error: proErr } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (proErr || !pro) {
      log.warn("Professional not found", {
        userId: user.id,
        dbError: proErr?.message,
      });
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const proId = pro.id;

    // Check Cache first if not forcefully refreshing
    if (!forceRefresh) {
      const { data: cache, error: cacheErr } = await supabase
        .from("pro_google_reviews_cache")
        .select("*")
        .eq("pro_id", proId)
        .single();
      
      if (!cacheErr && cache) {
        // If cached within the last 24 hours, return cache
        const hoursSinceCache = (Date.now() - new Date(cache.cached_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceCache < 24) {
          log.info("Returning cached Google reviews", { proId, hoursSinceCache });
          return NextResponse.json({
            success: true,
            cached: true,
            rating: cache.rating,
            totalReviews: cache.total_reviews,
            reviews: cache.reviews,
          });
        }
      }
    }

    log.info("Fetching fresh reviews from Google My Business API", { proId });

    // Fetch from Google
    const tokens = await getProTokens(proId);
    if (!tokens) {
      log.warn("No OAuth tokens — Google not connected", { proId });
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
    }

    const gbpData = await getProGBPData(proId);
    if (!gbpData?.gbp_location_name) {
      log.warn("GBP location not created yet", { proId });
      return NextResponse.json(
        { error: "Google Business location not created yet" },
        { status: 400 }
      );
    }

    const authClient = await getAuthenticatedClient(tokens, proId);
    
    // Using simple request as reviews might not be fully exposed in the current googleapis node library version
    const url = `https://mybusiness.googleapis.com/v4/${gbpData.gbp_location_name}/reviews`;
    const res = await authClient.request({ url });
    
    const data = res.data as any;
    const reviews = data.reviews || [];
    const averageRating = data.averageRating || null;
    const totalReviewCount = data.totalReviewCount || 0;

    log.info("Successfully fetched reviews from Google", { 
      proId, 
      count: reviews.length,
      averageRating,
      totalReviewCount 
    });

    // Upsert to Cache
    const { error: upsertErr } = await supabase
      .from("pro_google_reviews_cache")
      .upsert({
        pro_id: proId,
        place_id: gbpData.gbp_place_id || "unknown", // assuming place_id was saved when creating the location
        rating: averageRating,
        total_reviews: totalReviewCount,
        reviews: reviews,
        cached_at: new Date().toISOString()
      }, {
        onConflict: "pro_id"
      });

    if (upsertErr) {
      log.error("Failed to update reviews cache", { 
        proId, 
        errorCode: upsertErr.code, 
        errorMsg: upsertErr.message 
      });
      // Not returning error response, since we fetched them successfully. Just logging it.
    } else {
      log.debug("Successfully updated reviews cache", { proId });
    }

    return NextResponse.json({
      success: true,
      cached: false,
      rating: averageRating,
      totalReviews: totalReviewCount,
      reviews: reviews,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    gbpLog.error("Unhandled error in reviews sync", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
