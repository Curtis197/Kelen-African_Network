import { createClient } from "@/lib/supabase/server";

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
// Generate a direct Google review link (no API required)
// ──────────────────────────────────────────────

export function getGoogleReviewLink(placeId: string | null | undefined): string | null {
  if (!placeId) return null;
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

export function getGoogleReviewsLink(placeId: string | null | undefined): string | null {
  if (!placeId) return null;
  return `https://search.google.com/local/reviews?placeid=${placeId}`;
}

// ──────────────────────────────────────────────
// Fetch fresh reviews from the Places API
// Uses server-side key only — never exposed to client
// ──────────────────────────────────────────────

export async function fetchGoogleReviews(
  placeId: string
): Promise<GoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error("GOOGLE_PLACES_API_KEY is not configured");
    return null;
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json?` +
    `place_id=${encodeURIComponent(placeId)}&` +
    `fields=reviews,rating,user_ratings_total&` +
    `key=${apiKey}&` +
    `language=fr`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  const data = await response.json();

  if (data.status !== "OK") {
    console.error("Places API error:", data.status, data.error_message);
    return null;
  }

  return {
    place_id: placeId,
    reviews: data.result?.reviews || [],
    rating: data.result?.rating ?? null,
    total_reviews: data.result?.user_ratings_total || 0,
  };
}

// ──────────────────────────────────────────────
// Cache-first fetch — refreshes every 24 hours
// ──────────────────────────────────────────────

export async function getOrRefreshReviews(
  proId: string,
  placeId: string
): Promise<GoogleReviewsData | null> {
  const supabase = await createClient();

  // 1. Check cache
  const { data: cache } = await supabase
    .from("pro_google_reviews_cache")
    .select("*")
    .eq("pro_id", proId)
    .single();

  if (cache) {
    const ageHours =
      (Date.now() - new Date(cache.cached_at).getTime()) / 1000 / 60 / 60;

    if (ageHours < 24) {
      return {
        pro_id: cache.pro_id,
        place_id: cache.place_id,
        rating: cache.rating,
        total_reviews: cache.total_reviews,
        reviews: cache.reviews as GoogleReview[],
        cached_at: cache.cached_at,
      };
    }
  }

  // 2. Fetch fresh from Google
  const fresh = await fetchGoogleReviews(placeId);
  if (!fresh) return cache ? (cache as unknown as GoogleReviewsData) : null;

  // 3. Update cache
  await supabase.from("pro_google_reviews_cache").upsert({
    pro_id: proId,
    place_id: placeId,
    rating: fresh.rating,
    total_reviews: fresh.total_reviews,
    reviews: fresh.reviews,
    cached_at: new Date().toISOString(),
  });

  return fresh;
}
