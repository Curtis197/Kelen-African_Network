'use client';

import { WifiOff, Wifi, Loader2 } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface OfflineIndicatorProps {
  pendingDrafts?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

export default function OfflineIndicator({ pendingDrafts = 0, onSync, isSyncing = false }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline && pendingDrafts === 0) return null;

  return (
    <div
      className={`sticky top-0 z-40 px-4 py-3 flex items-center justify-between text-sm ${
        isOnline
          ? 'bg-green-50 text-green-800'
          : 'bg-amber-50 text-amber-800'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span>
          {isOnline
            ? `${pendingDrafts} brouillon(s) en attente de synchronisation`
            : 'Mode hors ligne — brouillons sauvegardés localement'}
        </span>
      </div>

      {isOnline && pendingDrafts > 0 && onSync && (
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isSyncing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            'Synchroniser'
          )}
        </button>
      )}
    </div>
  );
}
