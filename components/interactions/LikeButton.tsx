"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleRealizationLike } from "@/lib/actions/realization-likes";
import { toast } from "sonner";

interface LikeButtonProps {
  realizationId: string;
  initialLiked: boolean;
  initialCount: number;
  size?: "sm" | "md" | "lg";
}

export default function LikeButton({ realizationId, initialLiked, initialCount, size = "md" }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const handleLike = () => {
    startTransition(async () => {
      try {
        const result = await toggleRealizationLike(realizationId);
        setLiked(result.liked);
        setCount(result.count);
      } catch (error: any) {
        toast.error(error.message || "Erreur lors du like");
      }
    });
  };

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} transition-all active:scale-95 disabled:opacity-50 ${
        liked
          ? "text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
          : "text-stone-400 dark:text-on-surface-variant/60 hover:text-rose-500 dark:hover:text-rose-400"
      }`}
      aria-label={liked ? "Retirer le like" : "Liker cette réalisation"}
    >
      <Heart className={`${iconSizes[size]} ${liked ? "fill-current" : ""} transition-all`} />
      <span className="font-semibold">{count}</span>
    </button>
  );
}
