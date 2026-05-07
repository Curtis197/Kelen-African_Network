'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Share2, User, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProjectLog, LogComment } from '@/lib/types/daily-logs';
import type { ProProject } from '@/lib/types/pro-projects';
import AddClientContactModal from '@/components/pro/AddClientContactModal';

interface ProProjectLogDetailProps {
  log: ProjectLog;
  project: ProProject;
  initialComments: LogComment[];
  initialSignedUrls: Record<string, string>;
}

// Share modal wrapper that pre-fills client contact info
function ShareLogModalWithClientInfo({
  logId,
  isOpen,
  onClose,
  clientName,
  clientEmail,
  clientPhone,
}: {
  logId: string;
  isOpen: boolean;
  onClose: () => void;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
}) {
  return (
    <ShareLogModal
      logId={logId}
      isOpen={isOpen}
      onClose={onClose}
      defaultEmail={clientEmail || undefined}
      defaultPhone={clientPhone || undefined}
      recipientLabel={clientName ? `Client: ${clientName}` : undefined}
    />
  );
}

export default function ProProjectLogDetail({
  log: initialLog,
  project,
  initialComments,
  initialSignedUrls,
}: ProProjectLogDetailProps) {
  const router = useRouter();
  const [log, setLog] = useState<ProjectLog>(initialLog);
  const [comments, setComments] = useState<LogComment[]>(initialComments);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>(initialSignedUrls);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // We need to keep these local as they might be updated via context or modal
  const [clientName, setClientName] = useState<string | null>(project.client_name);
  const [clientEmail, setClientEmail] = useState<string | null>(project.client_email);
  const [clientPhone, setClientPhone] = useState<string | null>(project.client_phone);

  const reloadLog = useCallback(async () => {
    setIsReloading(true);
    // In a real app we'd call getLogById again, but for now we can rely on parent revalidation or simple state
    // For comments, we can refresh them
    try {
      const freshComments = await getLogComments(log.id);
      setComments(freshComments);
    } catch (err) {
    }
    setIsReloading(false);
  }, [log.id]);

  const handleStatusChange = () => {
    // When status changes, we might want to reload or just update local state
    // The easiest is to reload the page to get server-side updates
    router.refresh();
  };

  const dateStr = format(new Date(log.log_date), 'd MMMM yyyy', { locale: fr });
  const timeStr = format(new Date(log.created_at), 'HH:mm');
  const authorLabel = log.author_role === 'professional' ? 'Professionnel' : 'Client';
  const photos = log.media || [];
  const hasExif = photos.some(m => m.exif_latitude !== null && m.exif_longitude !== null);

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface pt-12 pb-24 px-4 md:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push(`/pro/projets/${project.id}/journal`)}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Retour au journal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {/* No client - show add button (Only for independent projects) */}
            {!project.is_collaboration && !clientEmail && !clientPhone && (
              <button
                onClick={() => setShowAddClientModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl font-medium text-sm hover:bg-primary/20 transition-colors"
                aria-label="Ajouter un contact client"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter client
              </button>
            )}
            
            {/* Share button - only show if project has client contact info */}
            {(clientEmail || clientPhone) && (
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl font-medium text-sm hover:bg-surface-container-high transition-colors"
                aria-label="Partager le rapport"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            )}
          </div>
        </div>

        {/* Log content */}
        <article className={`space-y-8 ${isReloading ? 'opacity-50' : ''}`}>
          {/* Meta header */}
          <div className="flex flex-wrap items-center gap-3">
            <time className="text-sm font-medium text-on-surface-variant" dateTime={log.log_date}>
              {dateStr} · {timeStr}
            </time>
            <LogStatusBadge status={log.status} />
          </div>

          {/* Title and description */}
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
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

          {/* GPS (only if there are photos with EXIF data) */}
          {hasExif && log.location_name && (
            <div className="bg-surface-container-low rounded-2xl p-5">
              <GPSDisplay
                latitude={log.gps_latitude}
                longitude={log.gps_longitude}
                locationName={log.location_name}
                source={log.is_synced ? 'exif' : undefined}
              />
            </div>
          )}

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
                âš ï¸ Problèmes rencontrés
              </h2>
              <p className="text-sm text-on-surface-variant bg-amber-50 rounded-xl p-5 whitespace-pre-wrap">
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
              projectId={project.id}
              authorId={log.author_id}
              currentStatus={log.status}
              onStatusChange={handleStatusChange}
            />
          </div>
        </article>
      </div>

      {/* Share modal */}
      <ShareLogModalWithClientInfo
        logId={log.id}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        clientName={clientName}
        clientEmail={clientEmail}
        clientPhone={clientPhone}
      />

      {/* Add client contact modal (Only for independent projects) */}
      {!project.is_collaboration && (
        <AddClientContactModal
          proProjectId={project.id}
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onClientAdded={(info) => {
            if (!info) return;
            setClientName(info.name);
            setClientEmail(info.email);
            setClientPhone(info.phone ?? "");
          }}
        />
      )}
    </main>
  );
}
