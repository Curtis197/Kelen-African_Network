'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getSharedLogByToken, recordShareView } from '@/lib/actions/log-shares';
import { approveLog, contestLog } from '@/lib/actions/log-comments';
import PhotoGrid from '@/components/journal/PhotoGrid';
import GPSDisplay from '@/components/journal/GPSDisplay';
import MoneyDisplay from '@/components/journal/MoneyDisplay';
import WeatherIcon from '@/components/journal/WeatherIcon';
import LogStatusBadge from '@/components/journal/LogStatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SharedLogData } from '@/lib/types/daily-logs';

export default function SharedLogPage() {
  const params = useParams();
  const shareToken = params.token as string;

  const [data, setData] = useState<SharedLogData | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const sharedData = await getSharedLogByToken(shareToken);
    if (sharedData) {
      setData(sharedData);

      // Record view
      await recordShareView(shareToken, null, navigator.userAgent);

      // Load signed URLs
      const urls: Record<string, string> = {};
      if (sharedData.log.media) {
        // For public page, we need to use server-side signed URL generation
        // This is a simplified version - in production, use an API route
      }
      setSignedUrls(urls);
    }

    setIsLoading(false);
  }, [shareToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (type: 'approval' | 'contest') => {
    if (!email.trim()) {
      toast.error('Veuillez entrer votre email');
      return;
    }
    if (!comment.trim()) {
      toast.error('Veuillez ajouter un commentaire');
      return;
    }

    setIsSubmitting(true);

    const action = type === 'approval' ? approveLog : contestLog;
    const result = await action(data!.log.id, comment);

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(type === 'approval' ? 'Rapport approuvé' : 'Rapport contesté');
      setHasSubmitted(true);
      setComment('');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-surface font-body text-on-surface flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-on-surface mb-2">
            Rapport introuvable
          </h1>
          <p className="text-sm text-on-surface-variant">
            Ce lien de partage n'est plus valide ou le rapport a été supprimé.
          </p>
        </div>
      </main>
    );
  }

  const { log, projectName } = data;
  const dateStr = format(new Date(log.log_date), 'd MMMM yyyy', { locale: fr });
  const photos = log.media || [];

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-bold text-primary">Kelen</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface">
            Rapport de chantier
          </h1>
          <p className="text-sm text-on-surface-variant">{projectName}</p>
          <time className="text-xs text-on-surface-variant/60" dateTime={log.log_date}>
            {dateStr}
          </time>
          <div className="flex justify-center">
            <LogStatusBadge status={log.status} />
          </div>
        </header>

        {/* Content */}
        <article className="space-y-6 bg-surface-container-low rounded-2xl p-6">
          <h2 className="text-xl font-bold text-on-surface">{log.title}</h2>
          <p className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
            {log.description}
          </p>

          {/* GPS */}
          <GPSDisplay latitude={log.gps_latitude} longitude={log.gps_longitude} />

          {/* Money */}
          {log.money_spent > 0 && <MoneyDisplay amount={log.money_spent} currency={log.money_currency} />}

          {/* Weather */}
          {log.weather && <WeatherIcon weather={log.weather} showLabel />}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-3">
                Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-xl overflow-hidden bg-surface-container"
                  >
                    <img
                      src={`/api/log-media/${photo.storage_path}`}
                      alt={photo.caption || photo.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {log.issues && (
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">⚠️ Problèmes</h3>
              <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                {log.issues}
              </p>
            </div>
          )}

          {/* Next steps */}
          {log.next_steps && (
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">📋 Prochaines étapes</h3>
              <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                {log.next_steps}
              </p>
            </div>
          )}
        </article>

        {/* View counter */}
        <div className="text-center text-xs text-on-surface-variant/60">
          <p>
            Ce rapport a été vu {data.shareInfo.view_count} fois
          </p>
          {data.shareInfo.first_viewed_at && (
            <p>
              Dernière vue : {format(new Date(data.shareInfo.first_viewed_at), 'd MMMM à HH:mm', { locale: fr })}
            </p>
          )}
        </div>

        {/* Response form */}
        {!hasSubmitted ? (
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-on-surface">Votre retour</h3>

            <div>
              <label htmlFor="share-email" className="sr-only">Votre email</label>
              <input
                id="share-email"
                type="email"
                placeholder="📧 Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
                required
              />
            </div>

            <div>
              <label htmlFor="share-comment" className="sr-only">Commentaire</label>
              <textarea
                id="share-comment"
                placeholder="💬 Commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleSubmit('approval')}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {isSubmitting ? 'Envoi...' : 'Approuver'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('contest')}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                {isSubmitting ? 'Envoi...' : 'Contester'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Merci pour votre retour. Votre réponse a été enregistrée.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-on-surface-variant/40 pt-8 border-t border-outline-variant/10">
          <p>Propulsé par Kelen</p>
          <p>kelen.africa</p>
        </footer>
      </div>
    </main>
  );
}
