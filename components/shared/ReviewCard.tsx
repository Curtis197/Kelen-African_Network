import { formatDate, getCountryName } from "@/lib/utils/format";
import { User, Star } from "lucide-react";

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
    <div className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star />
        ))}
        <span className="ml-2 text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">
          {rating}.0
        </span>
      </div>

      {comment && (
        <p className="text-sm leading-relaxed text-on-surface-variant font-body italic">
          &quot;{comment}&quot;
        </p>
      )}

      <div className="mt-6 pt-4 border-t border-outline-variant/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
        <div className="flex items-center gap-2">
          <User className="text-xs" />
          <span>
            {reviewerName}, {getCountryName(reviewerCountry)}
          </span>
        </div>
        <span>{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}
