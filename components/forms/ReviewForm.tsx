"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewFormData } from "@/lib/utils/validators";
import { submitReview } from "@/lib/actions/reviews";
import Link from "next/link";

interface ReviewFormProps {
  professionalId: string;
  professionalSlug: string;
}

export function ReviewForm({
  professionalId,
  professionalSlug,
}: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      professional_id: professionalId,
      rating: 0,
    },
  });

  const rating = watch("rating");

  const onSubmit = async (data: ReviewFormData) => {
    if (data.rating === 0) {
      setError("Veuillez sélectionner une note.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await submitReview({
        professional_id: data.professional_id,
        rating: data.rating,
        comment: data.comment,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Review submission error:", err);
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-kelen-green-50">
          <span className="text-2xl text-kelen-green-500">✓</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">Merci pour votre avis !</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre retour aide la communauté Kelen à identifier les meilleurs
          professionnels.
        </p>
        <div className="mt-6">
          <Link
            href={`/pro/${professionalSlug}`}
            className="rounded-lg bg-kelen-green-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            Retour au profil
          </Link>
        </div>
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

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Votre note
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-all hover:scale-110 active:scale-95"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => {
                setValue("rating", star);
                if (error) setError(null);
              }}
            >
              <span
                className={`text-3xl ${
                  star <= (hoverRating || rating)
                    ? "text-kelen-yellow-500"
                    : "text-stone-200"
                }`}
              >
                ★
              </span>
            </button>
          ))}
          <span className="ml-3 text-sm font-medium text-muted-foreground">
            {rating > 0 ? `${rating} / 5` : ""}
          </span>
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-kelen-red-500">
            {errors.rating.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Commentaire (optionnel)
        </label>
        <textarea
          {...register("comment")}
          rows={5}
          className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          placeholder="Racontez votre expérience..."
        />
        {errors.comment && (
          <p className="mt-1 text-xs text-kelen-red-500">
            {errors.comment.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-kelen-green-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-kelen-green-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 shadow-sm"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Envoi de l&apos;avis...
          </span>
        ) : (
          "Publier mon avis"
        )}
      </button>
    </form>
  );
}
