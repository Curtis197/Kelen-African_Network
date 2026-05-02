"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, BookOpen, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProProject } from "@/lib/types/pro-projects";
import type { ProjectLog } from "@/lib/types/daily-logs";
import { getMediaUrl } from "@/lib/actions/log-media";
import { createLog, getProjectLogs } from "@/lib/actions/daily-logs";
import { getAllDrafts, deleteDraft, markDraftPendingSync } from "@/lib/utils/daily-log-drafts";
import { exportJournalToPDF } from "@/lib/utils/pdf-export";
import LogTimeline from '@/components/journal/LogTimeline';
import LogForm from '@/components/journal/LogForm';
import OfflineIndicator from '@/components/journal/OfflineIndicator';
import { toast } from "sonner";

interface ProProjectJournalProps {
  project: ProProject;
}

export function ProProjectJournal({ project }: ProProjectJournalProps) {
  const router = useRouter();
  const PAGE_SIZE = 15;
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showNewLog, setShowNewLog] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  const loadLogs = useCallback(async (pageNum: number = 0, isAppend: boolean = false) => {
    if (pageNum === 0) setIsLoading(true);
    else setIsLoadingMore(true);

    const offset = pageNum * PAGE_SIZE;

    // Call server action instead of raw query for better consistency
    const data = await getProjectLogs(project.id, !project.is_collaboration, PAGE_SIZE, offset);
    
    if (isAppend) {
      setLogs(prev => [...prev, ...data]);
    } else {
      setLogs(data);
    }
    
    setHasMore(data.length === PAGE_SIZE);

    // Load signed URLs for photos in parallel
    const urls: Record<string, Record<string, string>> = {};
    const fetchPromises = data.map(async (log) => {
      if (log.media && log.media.length > 0) {
        const logMediaUrls: Record<string, string> = {};
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
  }, [project.id, project.is_collaboration]);

  useEffect(() => {
    loadLogs(0, false);
  }, [loadLogs]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadLogs(nextPage, true);
  };

  // Count pending drafts on mount
  useEffect(() => {
    const countDrafts = async () => {
      const drafts = await getAllDrafts(project.id);
      setPendingDrafts(drafts.filter(d => d.pendingSync).length);
    };
    countDrafts();
  }, [project.id]);

  // Sync drafts handler
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const drafts = await getAllDrafts(project.id);
      const pendingDrafts = drafts.filter(d => d.pendingSync);
      let syncedCount = 0;

      for (const draft of pendingDrafts) {
        try {
          const result = await createLog({
            ...draft.formData,
            projectId: project.id,
            isProProject: !project.is_collaboration,
          });
          if (result?.data) {
            await deleteDraft(draft.id);
            syncedCount++;
          }
        } catch (err) {
        }
      }

      if (syncedCount > 0) {
        toast.success(`${syncedCount} brouillon(s) synchronisÃ©(s)`);
        setPendingDrafts(0);
        loadLogs();
      } else {
        toast.info('Aucun brouillon Ã  synchroniser');
      }
    } catch (err) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }, [project.id, loadLogs]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pro-journal:${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_logs",
          filter: `${project.is_collaboration ? 'project_id' : 'pro_project_id'}=eq.${project.id}`,
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, loadLogs, supabase]);

  const handleExportPDF = async () => {
    try {
      await exportJournalToPDF(project.id, true);
      toast.success('Export PDF lancÃ©');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'export");
    }
  };

  if (showNewLog) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNewLog(false)}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Retour au journal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Nouveau rapport</h1>
            <p className="text-sm text-on-surface-variant mt-1">{project.title}</p>
          </div>
        </div>
        <LogForm
          projectId={project.id}
          proProjectId={!project.is_collaboration ? project.id : undefined}
          projectCurrency={project.currency || "XOF"}
          onSaved={() => {
            setShowNewLog(false);
            loadLogs();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline Sync Indicator */}
      <OfflineIndicator
        pendingDrafts={pendingDrafts}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/pro/projets/${project.id}`}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Retour au projet"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-on-surface-variant" />
            <div>
              <h1 className="text-xl font-bold text-on-surface">Journal</h1>
              <p className="text-sm text-on-surface-variant">{project.title}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-3 bg-surface-container text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors"
            aria-label="Exporter le journal en PDF"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
          <button
            onClick={() => setShowNewLog(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nouveau rapport
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-low rounded-2xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
      <div className="space-y-12">
        <LogTimeline
          logs={logs}
          projectId={project.id}
          proProjectId={project.id}
          photoUrls={photoUrls}
          onCreateFirst={() => setShowNewLog(true)}
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
  );
}
