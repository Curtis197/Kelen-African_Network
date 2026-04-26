import { createClient } from '@/lib/supabase/server'
import { GoogleReviewsSection } from '@/components/pro/GoogleReviewsSection'
import type { GoogleReview } from '@/lib/google-reviews'

export async function ProSiteGoogleReviews({ professionalId }: { professionalId: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pro_google_reviews_cache')
    .select('place_id, rating, total_reviews, reviews, featured_review_ids')
    .eq('pro_id', professionalId)
    .maybeSingle()

  if (!data?.rating || !data.total_reviews) return null

  const allReviews = (data.reviews as GoogleReview[]) ?? []
  const featuredIds = (data.featured_review_ids as string[] | null) ?? []

  // If the pro selected specific reviews, only show those. Otherwise show all (up to 6).
  const displayedReviews =
    featuredIds.length > 0
      ? allReviews.filter(r => featuredIds.includes(r.author_name))
      : allReviews

  if (displayedReviews.length === 0) return null

  return (
    <GoogleReviewsSection
      reviews={displayedReviews}
      rating={data.rating}
      totalReviews={data.total_reviews}
      placeId={data.place_id}
    />
  )
}
