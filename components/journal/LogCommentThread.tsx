import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, AlertTriangle, User } from 'lucide-react';
import type { LogComment } from '@/lib/types/daily-logs';

interface LogCommentThreadProps {
  comments: LogComment[];
}

export default function LogCommentThread({ comments }: LogCommentThreadProps) {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
        Commentaires ({comments.length})
      </h3>

      <div className="space-y-3">
        {comments.map((comment) => {
          const authorName = comment.author_name || 'Utilisateur';
          const timeAgo = formatDistanceToNow(new Date(comment.created_at), { locale: fr, addSuffix: true });

          return (
            <div
              key={comment.id}
              className="bg-surface-container-low rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-on-surface-variant" />
                <span className="text-sm font-medium text-on-surface">{authorName}</span>
                <span className="text-xs text-on-surface-variant/60">{timeAgo}</span>

                {comment.comment_type === 'approval' ? (
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Approuvé
                  </span>
                ) : (
                  <span className="ml-auto flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    Contesté
                  </span>
                )}
              </div>

              <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                {comment.comment_text}
              </p>

              {comment.evidence_urls && comment.evidence_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {comment.evidence_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      📎 Preuve {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
