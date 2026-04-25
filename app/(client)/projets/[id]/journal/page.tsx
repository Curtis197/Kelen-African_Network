'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getProjectLogs } from '@/lib/actions/daily-logs';
import { getMediaUrl } from '@/lib/actions/log-media';
import LogTimeline from '@/components/journal/LogTimeline';
import OfflineIndicator from '@/components/journal/OfflineIndicator';
import { Plus, ArrowLeft } from 'lucide-react';
import type { ProjectLog } from '@/lib/types/daily-logs';
import { getAllDrafts, getSyncQueue, deleteDraft, markDraftPendingSync, clearSyncQueue, getDraft } from '@/lib/utils/daily-log-drafts';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { toast } from 'sonner';
import { createLog } from '@/lib/actions/daily-logs';
import { uploadLogMedia } from '@/lib/actions/log-media';

export default function JournalListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const isOnline = useOnlineStatus();
  const PAGE_SIZE = 15;
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  const loadLogs = useCallback(async (pageNum: number = 0, isAppend: boolean = false) => {
    if (pageNum === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    const offset = pageNum * PAGE_SIZE;
    console.log('[JOURNAL] Fetching logs page:', pageNum, 'offset:', offset);
    
    const data = await getProjectLogs(projectId, false, PAGE_SIZE, offset);
    
    if (isAppend) {
      setLogs(prev => [...prev, ...data]);
    } else {
      setLogs(data);
    }
    
    setHasMore(data.length === PAGE_SIZE);

    // Load signed URLs for primary photos in batch (or at least parallelized)
    // We only fetch for the new items
    const urls: Record<string, Record<string, string>> = {};
    const fetchPromises = data.map(async (log) => {
      if (log.media && log.media.length > 0) {
        const logMediaUrls: Record<string, string> = {};
        // Parallelize media URL signing for each log
        await Promise.all(log.media.map(async (media) => {
          const signedUrl = await getMediaUrl(media.storage_path);
          if (signedUrl) {
            logMediaUrls[media.storage_path] = signedUrl;
          }
        }));
        urls[log.id] = logMediaUrls;
      }
    });

    await Promise.all(fetchPromises);
    
    setPhotoUrls(prev => ({ ...prev, ...urls }));
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [projectId]);

  useEffect(() => {
    loadLogs(0, false);
  }, [loadLogs]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadLogs(nextPage, true);
  };

  // Load pending draft count
  useEffect(() => {
    const loadDrafts = async () => {
      const queue = await getSyncQueue();
      setPendingDrafts(queue.length);
    };
    loadDrafts();
  }, []);

  // Handle sync when back online
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    const queue = await getSyncQueue();
    let synced = 0;
    let failed = 0;

    for (const draftId of queue) {
      try {
        // Read draft from IndexedDB
        const draft = await getDraft(draftId);
        if (!draft) {
          await deleteDraft(draftId);
          failed++;
          continue;
        }

        // Create log on server
        const result = await createLog({
          projectId: draft.projectId,
          isProProject: false,
          stepId: draft.stepId,
          logDate: draft.formData.logDate,
          title: draft.formData.title,
          description: draft.formData.description,
          moneySpent: draft.formData.moneySpent,
          moneyCurrency: draft.formData.moneyCurrency,
          paymentId: draft.formData.paymentId || undefined,
          issues: draft.formData.issues || undefined,
          nextSteps: draft.formData.nextSteps || undefined,
          weather: draft.formData.weather || undefined,
          gpsLatitude: draft.formData.gpsLatitude,
          gpsLongitude: draft.formData.gpsLongitude,
        });

        if (result.error || !result.data) {
          throw new Error(result.error || 'Failed to create log');
        }

        // Upload photos if any (draft stores them as File objects in IndexedDB — may not serialize)
        // For now, photos from offline drafts are lost during sync.
        // TODO: Store photos as base64 in IndexedDB or use background sync API.

        // Delete draft on success
        await deleteDraft(draftId);
        synced++;
      } catch (err) {
        console.error('Draft sync failed:', err);
        failed++;
      }
    }

    await clearSyncQueue();
    setPendingDrafts(0);
    setIsSyncing(false);

    if (synced > 0) {
      toast.success(`${synced} brouillon(s) synchronisé(s)`);
      loadLogs();
    }
    if (failed > 0) {
      toast.error(`${failed} brouillon(s) n'ont pas pu être synchronisés`);
    }
  }, [loadLogs]);

  // Refresh draft count when online status changes
  useEffect(() => {
    const loadDrafts = async () => {
      const queue = await getSyncQueue();
      setPendingDrafts(queue.length);
    };
    loadDrafts();
  }, [isOnline]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`journal:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_logs',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, loadLogs, supabase]);

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface pt-12 pb-24 px-4 md:px-12">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-surface-container transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
                Journal du chantier
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Rapports quotidiens d'avancement
              </p>
            </div>
          </div>

          <Link
            href={`/projets/${projectId}/journal/nouveau`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nouveau rapport
          </Link>
        </div>

        {/* Offline indicator */}
        <OfflineIndicator
          pendingDrafts={pendingDrafts}
          onSync={handleSync}
          isSyncing={isSyncing}
        />

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-container-low rounded-2xl p-6 h-48 animate-pulse"
              >
                <div className="h-4 bg-surface-container-high rounded w-1/4 mb-3" />
                <div className="h-6 bg-surface-container-high rounded w-3/4 mb-4" />
                <div className="h-4 bg-surface-container-high rounded w-full mb-2" />
                <div className="h-4 bg-surface-container-high rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            <LogTimeline
              logs={logs}
              projectId={projectId}
              photoUrls={photoUrls}
              onCreateFirst={() => router.push(`/projets/${projectId}/journal/nouveau`)}
            />

            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isLoadingMore ? "Chargement..." : "Charger plus d'historique"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
