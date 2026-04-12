import { createClient } from "@/lib/supabase/server";
import { reviewsLog } from "@/lib/logger";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface GoogleReview {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

export interface GoogleReviewsData {
  pro_id?: string;
  place_id: string;
  rating: number | null;
  total_reviews: number;
  reviews: GoogleReview[];
  cached_at?: string;
}

// ──────────────────────────────────────────────
// Generate review links (no API required)
// ──────────────────────────────────────────────

export function getGoogleReviewLink(placeId: string | null | undefined): string | null {
  if (!placeId) {
    reviewsLog.debug("getGoogleReviewLink: no placeId provided");
    return null;
  }
  const url = `https://search.google.com/local/writereview?placeid=${placeId}`;
  reviewsLog.debug("Review link generated", { placeId, url });
  return url;
}

export function getGoogleReviewsLink(placeId: string | null | undefined): string | null {
  if (!placeId) return null;
  return `https://search.google.com/local/reviews?placeid=${placeId}`;
}

// ──────────────────────────────────────────────
// Fetch fresh reviews from Places API
// ──────────────────────────────────────────────

export async function fetchGoogleReviews(
  placeId: string
): Promise<GoogleReviewsData | null> {
  const log = reviewsLog.child("fetch");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    log.error("GOOGLE_PLACES_API_KEY is not configured — cannot fetch reviews");
    return null;
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${encodeURIComponent(placeId)}&` +
    `fields=reviews,rating,user_ratings_total&` +
    `key=${apiKey}&` +
    `language=fr`;

  log.info("Calling Places API", { placeId });
  const start = Date.now();

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 0 } });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    log.error("Network error calling Places API", { placeId, error: msg });
    return null;
  }

  const ms = Date.now() - start;
  log.debug("Places API response received", {
    placeId,
    status: response.status,
    ms,
  });

  const data = await response.json();

  if (data.status !== "OK") {
    log.error("Places API returned non-OK status", {
      placeId,
      status:       data.status,
      errorMessage: data.error_message,
      ms,
    });
    return null;
  }

  const result: GoogleReviewsData = {
    place_id:      placeId,
    reviews:       data.result?.reviews || [],
    rating:        data.result?.rating ?? null,
    total_reviews: data.result?.user_ratings_total || 0,
  };

  log.info("Places API fetch successful", {
    placeId,
    rating:       result.rating,
    totalReviews: result.total_reviews,
    reviewCount:  result.reviews.length,
    ms,
  });

  return result;
}

// ──────────────────────────────────────────────
// Cache-first — refresh every 24 hours
// ──────────────────────────────────────────────

export async function getOrRefreshReviews(
  proId: string,
  placeId: string
): Promise<GoogleReviewsData | null> {
  const log = reviewsLog.child("cache");
  log.debug("getOrRefreshReviews called", { proId, placeId });

  const supabase = await createClient();

  // 1. Check cache
  const { data: cache, error: cacheErr } = await supabase
    .from("pro_google_reviews_cache")
    .select("*")
    .eq("pro_id", proId)
    .single();

  if (cacheErr) {
    if (cacheErr.code === "42501") {
      log.error("❌ RLS VIOLATION (EXPLICIT) — Cache read blocked!", {
        proId,
        table: "pro_google_reviews_cache",
        operation: "SELECT",
        errorCode: cacheErr.code,
        errorMessage: cacheErr.message,
        hint: "Check RLS policy 'pro_google_reviews_cache_public_select' — should allow public select for portfolio pages",
      });
    } else if (cacheErr.code !== "PGRST116") {
      log.warn("Error reading reviews cache", { proId, error: cacheErr.message, code: cacheErr.code });
    }
  }

  if (cache) {
    const ageMs    = Date.now() - new Date(cache.cached_at).getTime();
    const ageHours = ageMs / 1000 / 60 / 60;

    log.debug("Cache found", {
      proId,
      cachedAt:     cache.cached_at,
      ageHours:     Math.round(ageHours * 10) / 10,
      totalReviews: cache.total_reviews,
      rating:       cache.rating,
    });

    if (ageHours < 24) {
      log.info("Returning cached reviews (< 24h)", {
        proId,
        ageHours: Math.round(ageHours * 10) / 10,
        totalReviews: cache.total_reviews,
      });
      return {
        pro_id:        cache.pro_id,
        place_id:      cache.place_id,
        rating:        cache.rating,
        total_reviews: cache.total_reviews,
        reviews:       cache.reviews as GoogleReview[],
        cached_at:     cache.cached_at,
      };
    }

    log.info("Cache stale (> 24h) — refreshing from Places API", {
      proId,
      ageHours: Math.round(ageHours * 10) / 10,
    });
  } else {
    log.info("No cache found — fetching from Places API", { proId, placeId });
  }

  // 2. Fetch fresh
  const fresh = await fetchGoogleReviews(placeId);

  if (!fresh) {
    log.warn("Places API returned no data — falling back to stale cache", { proId });
    return cache ? (cache as unknown as GoogleReviewsData) : null;
  }

  // 3. Upsert cache
  log.debug("Upserting reviews cache", {
    proId,
    placeId,
    totalReviews: fresh.total_reviews,
    rating: fresh.rating,
  });

  const { error: upsertErr } = await supabase
    .from("pro_google_reviews_cache")
    .upsert({
      pro_id:        proId,
      place_id:      placeId,
      rating:        fresh.rating,
      total_reviews: fresh.total_reviews,
      reviews:       fresh.reviews,
      cached_at:     new Date().toISOString(),
    });

  if (upsertErr) {
    if (upsertErr.code === "42501") {
      log.error("❌ RLS VIOLATION (EXPLICIT) — Cache upsert blocked!", {
        proId,
        table: "pro_google_reviews_cache",
        operation: "UPSERT",
        errorCode: upsertErr.code,
        errorMessage: upsertErr.message,
        hint: "Check RLS policy 'pro_google_reviews_cache_insert_own' or 'update_own' — must allow where pro.user_id = auth.uid()",
      });
    } else {
      log.error("Failed to upsert reviews cache", {
        proId,
        errorCode: upsertErr.code,
        errorMessage: upsertErr.message,
      });
    }
  } else {
    log.info("Reviews cache updated", {
      proId,
      totalReviews: fresh.total_reviews,
      rating:       fresh.rating,
    });
  }

  return fresh;
}
