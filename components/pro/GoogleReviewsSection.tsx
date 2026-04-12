import type { GoogleReview } from "@/lib/google-reviews";
import { getGoogleReviewsLink } from "@/lib/google-reviews";

interface Props {
  reviews: GoogleReview[];
  rating: number | null;
  totalReviews: number;
  placeId: string;
}

export function GoogleReviewsSection({ reviews, rating, totalReviews, placeId }: Props) {
  if (!rating || totalReviews === 0) return null;

  const reviewsLink = getGoogleReviewsLink(placeId);

  return (
    <section className="py-16 px-4 sm:px-6 md:px-8 bg-surface-container-low" aria-label="Avis Google">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">
              Avis vérifiés
            </span>
            <div className="flex items-center gap-3 mt-2">
              <GoogleIcon className="w-6 h-6" />
              <span className="font-headline font-bold text-3xl text-on-surface">
                {rating.toFixed(1)}
              </span>
              <StarRating rating={rating} />
              <span className="text-on-surface-variant text-sm font-medium">
                {totalReviews} avis Google
              </span>
            </div>
          </div>

          {reviewsLink && (
            <a
              href={reviewsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              Voir sur Google Maps
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Review cards */}
        {reviews.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Sub-components ──────────────────────────────────────

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        {review.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {review.author_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{review.author_name}</p>
          <p className="text-xs text-muted-foreground">{review.relative_time_description}</p>
        </div>
        <div className="ml-auto shrink-0">
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>

      {review.text && (
        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-4">
          {review.text}
        </p>
      )}
    </div>
  );
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const starClass = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${starClass} ${star <= Math.round(rating) ? "text-amber-400" : "text-outline-variant"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
