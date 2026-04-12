import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gbpLog } from "@/lib/logger";

/**
 * GET /api/google/debug
 *
 * Returns the full GBP integration state for the authenticated professional.
 * Includes environment variable checks, token state, and GBP location status.
 *
 * IMPORTANT: Only enabled in non-production or when KELEN_DEBUG=true.
 * Never exposes actual tokens — shows only metadata.
 */
export async function GET(request: NextRequest) {
  const log = gbpLog.child("debug");

  const isDebugEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.KELEN_DEBUG === "true";

  if (!isDebugEnabled) {
    log.warn("Debug endpoint accessed in production without KELEN_DEBUG=true");
    return NextResponse.json(
      { error: "Debug endpoint disabled in production. Set KELEN_DEBUG=true to enable." },
      { status: 403 }
    );
  }

  log.info("→ GET /api/google/debug");

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    log.warn("Unauthenticated debug request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  log.debug("User authenticated", { userId: user.id });

  // Load professional profile
  const { data: pro, error: proErr } = await supabase
    .from("professionals")
    .select("id, business_name, slug, category, city, country_code, phone")
    .eq("user_id", user.id)
    .single();

  // Load GBP tokens (without exposing actual token values)
  const { data: tokens, error: tokensErr } = await supabase
    .from("pro_google_tokens")
    .select("*")
    .eq("pro_id", pro?.id || "")
    .single();

  // Load reviews cache
  const { data: reviewsCache } = await supabase
    .from("pro_google_reviews_cache")
    .select("place_id, rating, total_reviews, cached_at")
    .eq("pro_id", pro?.id || "")
    .single();

  // Build debug report
  const now = Date.now();
  const expiryDate = tokens?.expiry_date ?? 0;
  const tokenAgeMs = expiryDate ? expiryDate - now : null;

  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv:             process.env.NODE_ENV,
      hasGoogleClientId:   !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret:     !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri:         process.env.GOOGLE_REDIRECT_URI || "(not set)",
      hasPlacesApiKey:     !!process.env.GOOGLE_PLACES_API_KEY,
      siteUrl:             process.env.NEXT_PUBLIC_SITE_URL || "(not set)",
      logLevel:            process.env.KELEN_LOG_LEVEL || "default (info/debug)",
    },
    auth: {
      userId:        user.id,
      email:         user.email,
      role:          user.role,
    },
    professional: proErr
      ? { error: proErr.message }
      : {
          id:           pro?.id,
          businessName: pro?.business_name,
          slug:         pro?.slug,
          category:     pro?.category,
          city:         pro?.city,
          countryCode:  pro?.country_code,
          hasPhone:     !!pro?.phone,
        },
    googleTokens: tokensErr
      ? { error: tokensErr.code === "PGRST116" ? "Not connected (no tokens)" : tokensErr.message }
      : {
          isConnected:         true,
          hasAccessToken:      !!tokens?.access_token,
          hasRefreshToken:     !!tokens?.refresh_token,
          expiryDate:          expiryDate ? new Date(expiryDate).toISOString() : null,
          tokenExpiresInMs:    tokenAgeMs,
          tokenExpiresInMin:   tokenAgeMs ? Math.round(tokenAgeMs / 60000) : null,
          isExpired:           expiryDate > 0 && expiryDate < now,
          isExpiringSoon:      expiryDate > 0 && expiryDate < now + 5 * 60 * 1000,
          connectedAt:         tokens?.connected_at,
          lastSyncedAt:        tokens?.last_synced_at,
          verificationStatus:  tokens?.verification_status,
          gbpAccountName:      tokens?.gbp_account_name,
          gbpLocationName:     tokens?.gbp_location_name,
          gbpPlaceId:          tokens?.gbp_place_id,
        },
    reviewsCache: reviewsCache
      ? {
          placeId:      reviewsCache.place_id,
          rating:       reviewsCache.rating,
          totalReviews: reviewsCache.total_reviews,
          cachedAt:     reviewsCache.cached_at,
          ageHours:     reviewsCache.cached_at
            ? Math.round((now - new Date(reviewsCache.cached_at).getTime()) / 36000) / 100
            : null,
        }
      : { status: "no cache" },
    routing: {
      oauthAuthorizeUrl: `/api/auth/google/authorize?proId=${pro?.id || "<proId>"}`,
      oauthCallbackUrl:  process.env.GOOGLE_REDIRECT_URI || "(not configured)",
      createBusinessUrl: "/api/google/create-business",
      syncPhotosUrl:     "/api/google/sync-photos",
      syncProfileUrl:    "/api/google/sync-profile",
      requestVerifUrl:   "/api/google/request-verification",
      debugUrl:          "/api/google/debug",
    },
    reviewLink: tokens?.gbp_place_id
      ? `https://search.google.com/local/writereview?placeid=${tokens.gbp_place_id}`
      : null,
  };

  log.info("Debug report generated", {
    userId:              user.id,
    proId:               pro?.id,
    isConnected:         !!tokens?.access_token,
    verificationStatus:  tokens?.verification_status,
  });

  return NextResponse.json(report, { status: 200 });
}
