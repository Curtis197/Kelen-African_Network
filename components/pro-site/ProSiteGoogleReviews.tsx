import { createClient } from '@/lib/supabase/server'
import { GoogleReviewsSection } from '@/components/pro/GoogleReviewsSection'
import type { GoogleReview } from '@/lib/google-reviews'

export async function ProSiteGoogleReviews({ professionalId }: { professionalId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pro_google_reviews_cache')
    .select('place_id, rating, total_reviews, reviews')
    .eq('pro_id', professionalId)
    .maybeSingle()

  if (!data?.rating || !data.total_reviews) return null

  return (
    <GoogleReviewsSection
      reviews={(data.reviews as GoogleReview[]) ?? []}
      rating={data.rating}
      totalReviews={data.total_reviews}
      placeId={data.place_id}
    />
  )
}
