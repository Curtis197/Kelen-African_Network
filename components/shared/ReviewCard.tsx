import { formatDate, getCountryName } from "@/lib/utils/format";

interface ReviewCardProps {
  rating: number;
  comment: string | null;
  reviewerName: string;
  reviewerCountry: string;
  createdAt: string;
}

export function ReviewCard({
  rating,
  comment,
  reviewerName,
  reviewerCountry,
  createdAt,
}: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      {/* Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-lg ${
              i < rating ? "text-kelen-yellow-500" : "text-stone-200"
            }`}
          >
            ★
          </span>
        ))}
      </div>

      {comment && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          {comment}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {reviewerName}, {getCountryName(reviewerCountry)}
        </span>
        <span>{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}
