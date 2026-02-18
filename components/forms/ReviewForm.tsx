"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewFormData } from "@/lib/utils/validators";

interface ReviewFormProps {
  professionalId: string;
  professionalName: string;
}

export function ReviewForm({ professionalId, professionalName }: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      professional_id: professionalId,
      rating: 0,
    },
  });

  const currentRating = watch("rating");

  const onSubmit = async (data: ReviewFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with Supabase insert
      // const { error } = await supabase.from('reviews').insert({
      //   ...data,
      //   reviewer_id: session.user.id,
      // });

      console.log("Review submitted:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kelen-green-50">
          <span className="text-3xl text-kelen-green-500">✓</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Avis publié</h2>
        <p className="mt-2 text-muted-foreground">
          Merci pour votre avis sur <strong>{professionalName}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-kelen-red-500/20 bg-kelen-red-50 p-3 text-sm text-kelen-red-700">
          {error}
        </div>
      )}

      <input type="hidden" {...register("professional_id")} />

      {/* Star rating */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Votre note
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setValue("rating", star, { shouldValidate: true })}
              className="text-3xl transition-transform hover:scale-110"
            >
              {star <= (hoveredStar || currentRating) ? "★" : "☆"}
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-kelen-red-500">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="comment"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Commentaire (optionnel)
        </label>
        <textarea
          id="comment"
          {...register("comment")}
          rows={4}
          className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          placeholder="Partagez votre expérience..."
        />
        {errors.comment && (
          <p className="mt-1 text-xs text-kelen-red-500">
            {errors.comment.message}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {watch("comment")?.length || 0} / 2000
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Publication en cours..." : "Publier mon avis"}
      </button>
    </form>
  );
}
