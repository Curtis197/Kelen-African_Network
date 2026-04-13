"use client";

import { useState, useTransition } from "react";
import { User, Loader2 } from "lucide-react";
import { createRealizationComment } from "@/lib/actions/realization-comments";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: { display_name: string; country: string } | null;
}

interface RealizationCommentThreadProps {
  realizationId: string;
  initialComments: Comment[];
}

export default function RealizationCommentThread({ realizationId, initialComments }: RealizationCommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      const result = await createRealizationComment(realizationId, newComment);
      
      if (result.success) {
        setNewComment("");
        toast.success("Commentaire envoyé ! Il sera visible après validation par le professionnel.");
      } else {
        toast.error(result.error || "Erreur lors de l'envoi du commentaire");
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-8">
      {/* Comments List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-stone-900">
          Commentaires ({comments.length})
        </h3>

        {comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-4 bg-stone-50 rounded-xl">
                <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-stone-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-stone-900">
                      {comment.author?.display_name || "Utilisateur"}
                    </span>
                    {comment.author?.country && (
                      <span className="text-xs text-stone-400">
                        · {comment.author.country}
                      </span>
                    )}
                    <span className="text-xs text-stone-400">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-stone-50 rounded-xl">
            <p className="text-stone-400 text-sm font-medium">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </p>
          </div>
        )}
      </div>

      {/* Comment Form */}
      <div className="border-t border-stone-200 pt-8">
        <h4 className="text-base font-bold text-stone-900 mb-4">
          Ajouter un commentaire
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Partagez votre avis sur cette réalisation..."
            rows={4}
            className="w-full px-4 py-3 text-sm rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 resize-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              Le commentaire sera visible après validation par le professionnel
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-kelen-green-600 text-white rounded-xl font-semibold text-sm hover:bg-kelen-green-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Envoyer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
