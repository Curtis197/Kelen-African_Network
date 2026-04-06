'use client';

import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, AlertTriangle } from 'lucide-react';
import type { ProjectLog } from '@/lib/types/daily-logs';
import LogStatusBadge from './LogStatusBadge';
import MoneyDisplay from './MoneyDisplay';

interface LogCardProps {
  log: ProjectLog;
  projectId: string;
  primaryPhotoUrl?: string;
  photoCount: number;
}

export default function LogCard({ log, projectId, primaryPhotoUrl, photoCount }: LogCardProps) {
  const authorLabel = log.author_role === 'professional' ? 'Pro' : 'Client';
  const dateStr = format(new Date(log.log_date), 'd MMMM yyyy', { locale: fr });
  const timeStr = format(new Date(log.created_at), 'HH:mm');
  const relativeTime = formatDistanceToNow(new Date(log.created_at), { locale: fr, addSuffix: true });

  return (
    <Link
      href={`/projets/${projectId}/journal/${log.id}`}
      className="block group"
      aria-label={`Rapport du ${dateStr}: ${log.title}`}
    >
      <article className="bg-surface-container-low dark:bg-surface-container-low rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow border border-outline-variant/10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <time className="text-xs font-medium text-on-surface-variant" dateTime={log.log_date}>
                {dateStr}
              </time>
              <span className="text-xs text-on-surface-variant/60">·</span>
              <time className="text-xs text-on-surface-variant/60" dateTime={log.created_at}>
                {timeStr}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <User className="w-3 h-3" />
                <span>{authorLabel}</span>
              </div>
              <LogStatusBadge status={log.status} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {log.title}
        </h3>

        {/* Description preview */}
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">
          {log.description}
        </p>

        {/* Photo thumbnails */}
        {photoCount > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {primaryPhotoUrl && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-surface-container">
                <img src={primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {photoCount > 1 && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center">
                <span className="text-xs text-on-surface-variant">+{photoCount - 1}</span>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
          {log.money_spent > 0 && (
            <MoneyDisplay amount={log.money_spent} currency={log.money_currency} compact />
          )}
          <span className="font-mono">
            📍 {log.gps_latitude.toFixed(2)}°N, {log.gps_longitude.toFixed(2)}°W
          </span>
        </div>

        {/* Issues flag */}
        {log.issues && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{log.issues}</span>
          </div>
        )}
      </article>
    </Link>
  );
}
