"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ProjectCollaboration } from "@/lib/types/collaborations";
import { Badge } from "@/components/ui/badge";
import {
  Handshake,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Invitation en attente",
    className: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  negotiating: {
    label: "Négociation",
    className: "bg-purple-100 text-purple-700",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  active: {
    label: "Actif",
    className: "bg-green-500 text-white",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  declined: {
    label: "Refusé",
    className: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  not_picked: {
    label: "Non retenu",
    className: "bg-surface-container text-on-surface-variant",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  terminated: {
    label: "Terminé",
    className: "bg-surface-container text-on-surface-variant",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

type CollaborationWithProject = Omit<ProjectCollaboration, 'project'> & {
  project: {
    id: string;
    title: string;
    category: string | null;
    location: string | null;
    budget_total: number | null;
    budget_currency: string | null;
    user: { display_name: string } | null;
  } | null;
};

export default function ProCollaborationsPage() {
  console.log('[COMPONENT] ========================================');
  console.log('[COMPONENT] ProCollaborationsPage RENDER START');
  console.log('[COMPONENT] ========================================');

  const [collaborations, setCollaborations] = useState<CollaborationWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[STATE] Initial state:', { count: collaborations.length, isLoading, error });

  useEffect(() => {
    console.log('[EFFECT] ========================================');
    console.log('[EFFECT] ProCollaborationsPage useEffect triggered');
    console.log('[EFFECT] ========================================');

    const fetchCollaborations = async () => {
      console.log('[FETCH] Starting collaboration fetch...');
      const supabase = createClient();

      // ── AUTH ──────────────────────────────────────────
      console.log('[AUTH] Checking user session...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[AUTH] Result:', { userId: user?.id, email: user?.email, error: authError?.message });

      if (authError || !user) {
        console.error('[AUTH] ❌ No authenticated user — aborting fetch');
        setError('Non authentifié');
        setIsLoading(false);
        return;
      }
      console.log('[AUTH] ✅ User authenticated:', user.id);

      // ── FETCH PROFESSIONAL ID ──────────────────────────
      console.log('[DB] Fetching professional profile for user:', user.id);
      const { data: professional, error: proError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('[DB] Professional lookup result:', {
        professionalId: professional?.id,
        error: proError?.message,
        code: proError?.code,
      });

      if (proError?.code === '42501') {
        console.error('[RLS] ❌ EXPLICIT RLS BLOCKING!');
        console.error('[RLS] Table: professionals');
        console.error('[RLS] User:', user.id);
        console.error('[RLS] Fix: Add SELECT policy for own professional row');
      }

      if (!professional) {
        console.warn('[FETCH] ⚠️ No professional profile found for user:', user.id);
        console.warn('[FETCH] User is not registered as a professional');
        setIsLoading(false);
        return;
      }

      // ── FETCH COLLABORATIONS ──────────────────────────
      console.log('[DB] ========================================');
      console.log('[DB] Querying project_collaborations');
      console.log('[DB] professional_id:', professional.id);
      console.log('[DB] ========================================');

      const { data, error: collabError } = await supabase
        .from('project_collaborations')
        .select(`
          *,
          project:user_projects(
            id,
            title,
            category,
            location,
            budget_total,
            budget_currency,
            user:users(display_name)
          )
        `)
        .eq('professional_id', professional.id)
        .order('created_at', { ascending: false });

      console.log('[DB] project_collaborations result:', {
        count: data?.length,
        error: collabError?.message,
        code: collabError?.code,
      });

      // ── RLS DETECTION ─────────────────────────────────
      if (collabError) {
        if (collabError.code === '42501') {
          console.error('[RLS] ========================================');
          console.error('[RLS] ❌ EXPLICIT RLS BLOCKING!');
          console.error('[RLS] Table: project_collaborations');
          console.error('[RLS] Operation: SELECT');
          console.error('[RLS] User:', user.id);
          console.error('[RLS] Professional:', professional.id);
          console.error('[RLS] Fix: Add collab_pro_read policy (SELECT where professional_id = auth uid)');
          console.error('[RLS] ========================================');
        } else {
          console.error('[DB] ❌ Database error (NOT RLS):', collabError.message);
        }
        setError(collabError.message);
        setIsLoading(false);
        return;
      }

      if (!collabError && (!data || data.length === 0)) {
        console.warn('[RLS] ========================================');
        console.warn('[RLS] ⚠️ SILENT RLS FILTERING — 0 rows returned');
        console.warn('[RLS] Table: project_collaborations');
        console.warn('[RLS] Professional:', professional.id);
        console.warn('[RLS] Could be: no data yet, or RLS silently filtering');
        console.warn('[RLS] Verify: check Supabase table editor for rows with this professional_id');
        console.warn('[RLS] ========================================');
      } else {
        console.log('[DB] ✅ Collaborations fetched successfully:', data?.length, 'rows');
        data?.forEach((c, i) => {
          console.log(`[DB]   [${i}] id:${c.id} status:${c.status} project:${(c as CollaborationWithProject).project?.title}`);
        });
      }

      console.log('[STATE] Setting collaborations:', data?.length || 0);
      setCollaborations((data as CollaborationWithProject[]) || []);
      setIsLoading(false);

      console.log('[FETCH] ✅ Fetch complete');
    };

    fetchCollaborations();
  }, []);

  // ── RENDER GUARDS ─────────────────────────────────────
  console.log('[RENDER] State:', { isLoading, error, count: collaborations.length });

  if (isLoading) {
    console.log('[RENDER] → Loading spinner');
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error('[RENDER] → Error state:', error);
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-on-surface mb-2">Erreur de chargement</h1>
        <p className="text-sm text-on-surface-variant">{error}</p>
      </div>
    );
  }

  const active = collaborations.filter(c => ['pending', 'negotiating', 'active'].includes(c.status));
  const archived = collaborations.filter(c => ['declined', 'not_picked', 'terminated'].includes(c.status));

  console.log('[RENDER] Groups:', { active: active.length, archived: archived.length });

  if (collaborations.length === 0) {
    console.log('[RENDER] → Empty state (no collaborations)');
  } else {
    console.log('[RENDER] → Main UI with', collaborations.length, 'collaborations');
  }

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-4xl w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Handshake className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Collaborations</h1>
            <p className="text-sm text-on-surface-variant">Invitations et projets clients</p>
          </div>
        </div>

        {collaborations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Handshake className="w-16 h-16 text-on-surface-variant/20 mb-6" />
            <h2 className="text-xl font-bold text-on-surface mb-2">Aucune collaboration</h2>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Lorsque des clients vous invitent à rejoindre leurs projets, vous les verrez ici.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active */}
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                  En cours ({active.length})
                </h2>
                <div className="space-y-3">
                  {active.map(collab => (
                    <CollaborationCard key={collab.id} collab={collab} />
                  ))}
                </div>
              </section>
            )}

            {/* Archived */}
            {archived.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                  Archivés ({archived.length})
                </h2>
                <div className="space-y-3 opacity-60">
                  {archived.map(collab => (
                    <CollaborationCard key={collab.id} collab={collab} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ── CARD COMPONENT ─────────────────────────────────────────────────────────────

function CollaborationCard({ collab }: { collab: CollaborationWithProject }) {
  console.log('[COMPONENT] CollaborationCard render:', { id: collab.id, status: collab.status, project: collab.project?.title });

  const statusCfg = STATUS_CONFIG[collab.status] || STATUS_CONFIG['pending'];
  const project = collab.project;

  return (
    <Link
      href={`/pro/collaborations/${collab.id}`}
      className="flex items-center gap-4 bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface-container transition-colors group"
      onClick={() => console.log('[RENDER] CollaborationCard clicked, navigating to:', `/pro/collaborations/${collab.id}`)}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-on-surface truncate">
            {project?.title || 'Projet client'}
          </span>
          <Badge className={`text-xs gap-1 ${statusCfg.className}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-on-surface-variant">
          {project?.category && <span className="capitalize">{project.category}</span>}
          {project?.location && <span>{project.location}</span>}
          {project?.user?.display_name && <span>Client : {project.user.display_name}</span>}
          {project?.budget_total && (
            <span>{project.budget_total.toLocaleString('fr-FR')} {project.budget_currency || 'XOF'}</span>
          )}
        </div>
        {collab.status === 'pending' && (
          <div className="mt-1.5 text-xs text-yellow-600 font-medium">
            Invité le {new Date(collab.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — en attente de votre réponse
          </div>
        )}
        {collab.proposal_submitted_at && collab.status === 'negotiating' && (
          <div className="mt-1.5 text-xs text-purple-600">
            Proposition soumise le {new Date(collab.proposal_submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </div>
        )}
        {collab.status === 'active' && collab.started_at && (
          <div className="mt-1.5 text-xs text-green-600">
            Actif depuis le {new Date(collab.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </div>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors shrink-0" />
    </Link>
  );
}
