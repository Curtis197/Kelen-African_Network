'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getLogById } from '@/lib/actions/daily-logs';
import { getMediaUrl } from '@/lib/actions/log-media';
import { getLogComments } from '@/lib/actions/log-comments';
import LogActions from '@/components/journal/LogActions';
import LogCommentThread from '@/components/journal/LogCommentThread';
import PhotoGrid from '@/components/journal/PhotoGrid';
import GPSDisplay from '@/components/journal/GPSDisplay';
import MoneyDisplay from '@/components/journal/MoneyDisplay';
import WeatherIcon from '@/components/journal/WeatherIcon';
import LogStatusBadge from '@/components/journal/LogStatusBadge';
import ShareLogModal from '@/components/journal/ShareLogModal';
import { ArrowLeft, Share2, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProjectLog, LogComment } from '@/lib/types/daily-logs';

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const logId = params.logId as string;

  const [log, setLog] = useState<ProjectLog | null>(null);
  const [comments, setComments] = useState<LogComment[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Pass projectId to satisfy RLS
    const result = await getLogById(logId, projectId);
    if (result?.data) {
      setLog(result.data);

      // Load signed URLs for photos
      const urls: Record<string, string> = {};
      if (result.data.media) {
        for (const media of result.data.media) {
          const url = await getMediaUrl(media.storage_path);
          if (url) {
            urls[media.storage_path] = url;
          }
        }
      }
      setSignedUrls(urls);
    }

    const commentsData = await getLogComments(logId);
    setComments(commentsData);

    setIsLoading(false);
  }, [logId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = useCallback(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface font-body text-on-surface pt-12 pb-24 px-4 md:px-12">
        <div className="max-w-4xl mx-auto animate-pulse space-y-8">
          <div className="h-6 bg-surface-container-high rounded w-1/4" />
          <div className="h-10 bg-surface-container-high rounded w-3/4" />
          <div className="h-40 bg-surface-container-high rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!log) {
    return (
      <main className="min-h-screen bg-surface font-body text-on-surface pt-12 pb-24 px-4 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-on-surface mb-4">Rapport introuvable</h1>
          <button
            onClick={() => router.push(`/projets/${projectId}/journal`)}
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm"
          >
            Retour au journal
          </button>
        </div>
      </main>
    );
  }

  const dateStr = format(new Date(log.log_date), 'd MMMM yyyy', { locale: fr });
  const timeStr = format(new Date(log.created_at), 'HH:mm');
  const authorLabel = log.author_role === 'professional' ? 'Professionnel' : 'Client';

  const photos = log.media || [];

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface pt-12 pb-24 px-4 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push(`/projets/${projectId}/journal`)}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Retour au journal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl font-medium text-sm hover:bg-surface-container-high transition-colors"
              aria-label="Partager le rapport"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>
          </div>
        </div>

        {/* Log content */}
        <article className="space-y-8">
          {/* Meta header */}
          <div className="flex flex-wrap items-center gap-3">
            <time className="text-sm font-medium text-on-surface-variant" dateTime={log.log_date}>
              {dateStr} · {timeStr}
            </time>
            <LogStatusBadge status={log.status} />
          </div>

          {/* Title and description */}
          <div className="bg-surface-container-low dark:bg-surface-container-low rounded-2xl p-6 space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
              {log.title}
            </h1>
            <p className="text-base text-on-surface-variant whitespace-pre-wrap leading-relaxed">
              {log.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <User className="w-4 h-4" />
              <span>Rédigé par {authorLabel}</span>
            </div>
          </div>

          {/* GPS */}
          <div className="bg-surface-container-low rounded-2xl p-5">
            <GPSDisplay
              latitude={log.gps_latitude}
              longitude={log.gps_longitude}
              source={log.is_synced ? 'exif' : undefined}
            />
          </div>

          {/* Money */}
          {log.money_spent > 0 && (
            <div className="bg-surface-container-low rounded-2xl p-5">
              <MoneyDisplay amount={log.money_spent} currency={log.money_currency} />
            </div>
          )}

          {/* Weather */}
          {log.weather && (
            <div className="bg-surface-container-low rounded-2xl p-5">
              <WeatherIcon weather={log.weather} showLabel />
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-on-surface mb-4">
                Photos ({photos.length})
              </h2>
              <PhotoGrid photos={photos} signedUrls={signedUrls} />
            </div>
          )}

          {/* Issues */}
          {log.issues && (
            <div>
              <h2 className="text-sm font-bold text-on-surface mb-3">
                ⚠️ Problèmes rencontrés
              </h2>
              <p className="text-sm text-on-surface-variant bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 whitespace-pre-wrap">
                {log.issues}
              </p>
            </div>
          )}

          {/* Next steps */}
          {log.next_steps && (
            <div>
              <h2 className="text-sm font-bold text-on-surface mb-3">
                📋 Prochaines étapes
              </h2>
              <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-xl p-5 whitespace-pre-wrap">
                {log.next_steps}
              </p>
            </div>
          )}

          {/* Comments */}
          <LogCommentThread comments={comments} />

          {/* Actions */}
          <div className="border-t border-outline-variant/20 pt-6">
            <LogActions
              logId={log.id}
              projectId={projectId}
              authorId={log.author_id}
              currentStatus={log.status}
              onStatusChange={handleStatusChange}
            />
          </div>
        </article>
      </div>

      {/* Share modal */}
      <ShareLogModal
        logId={log.id}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </main>
  );
}
