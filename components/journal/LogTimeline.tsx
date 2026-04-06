'use client';

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProjectLog } from '@/lib/types/daily-logs';
import LogCard from './LogCard';
import LogEmptyState from './LogEmptyState';

interface LogTimelineProps {
  logs: ProjectLog[];
  projectId: string;
  photoUrls: Record<string, Record<string, string>>; // logId -> { storage_path: url }
  onCreateFirst?: () => void;
}

export default function LogTimeline({ logs, projectId, photoUrls, onCreateFirst }: LogTimelineProps) {
  if (logs.length === 0) {
    return <LogEmptyState onCreateFirst={onCreateFirst} />;
  }

  // Group logs by month/year
  const grouped = logs.reduce<Record<string, ProjectLog[]>>((acc, log) => {
    const date = parseISO(log.log_date);
    const key = format(date, 'MMMM yyyy', { locale: fr });
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([monthLabel, monthLogs]) => (
        <div key={monthLabel}>
          {/* Month header */}
          <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-3">
            <span className="w-8 h-px bg-outline-variant/30" />
            {monthLabel}
          </h3>

          {/* Logs */}
          <div className="space-y-4">
            {monthLogs.map((log) => {
              const urls = photoUrls[log.id] || {};
              const primaryPhoto = log.media?.find(m => m.is_primary);
              const primaryPhotoUrl = primaryPhoto ? urls[primaryPhoto.storage_path] : undefined;
              const photoCount = log.media?.length || 0;

              return (
                <LogCard
                  key={log.id}
                  log={log}
                  projectId={projectId}
                  primaryPhotoUrl={primaryPhotoUrl}
                  photoCount={photoCount}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
