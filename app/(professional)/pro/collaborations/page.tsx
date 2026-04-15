"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ProjectCollaboration } from "@/lib/types/collaborations";
import type { GoogleReview } from "@/lib/google-reviews";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Handshake,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  MessageCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type CollaborationWithProject = Omit<ProjectCollaboration, "project"> & {
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

type PendingComment = {
  id: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  realization_id: string;
  realization: { id: string; title: string } | null;
  author: { display_name: string } | null;
};

type GoogleReviewsCache = {
  pro_id: string;
  place_id: string;
  rating: number | null;
  total_reviews: number;
  reviews: GoogleReview[];
  cached_at: string;
};

// ── Status config ────────────────────────────────────────────────────────────

const COLLAB_STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
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

const COMMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approuvé", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rejeté", className: "bg-red-100 text-red-700" },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProCollaborationsPage() {
  console.log('[COMPONENT] ========================================');
  console.log('[COMPONENT] ProCollaborationsPage (social inbox) RENDER');
  console.log('[COMPONENT] ========================================');

  // ── Shared state ────────────────────────────────────────────────────────────
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Tab 1: Proposals ────────────────────────────────────────────────────────
  const [collaborations, setCollaborations] = useState<CollaborationWithProject[]>([]);

  // ── Tab 2: Comments ─────────────────────────────────────────────────────────
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentFilter, setCommentFilter] = useState<"pending" | "approved" | "all">("pending");
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // ── Tab 3: Google Reviews ───────────────────────────────────────────────────
  const [googleCache, setGoogleCache] = useState<GoogleReviewsCache | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Initial load: auth + professional + collaborations ──────────────────────
  useEffect(() => {
    console.log('[EFFECT] ProCollaborationsPage mount — fetching initial data');

    const init = async () => {
      const supabase = createClient();

      // AUTH
      console.log('[AUTH] Checking session...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[AUTH] Result:', { userId: user?.id, error: authError?.message });

      if (authError || !user) {
        console.error('[AUTH] ❌ Not authenticated');
        setError('Non authentifié');
        setIsLoading(false);
        return;
      }

      // PROFESSIONAL ID
      console.log('[DB] Fetching professional for user:', user.id);
      const { data: pro, error: proError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('[DB] Professional result:', { id: pro?.id, error: proError?.message, code: proError?.code });
      if (proError?.code === '42501') console.error('[RLS] ❌ EXPLICIT RLS on professionals');
      if (!pro) { setIsLoading(false); return; }

      setProfessionalId(pro.id);
      console.log('[STATE] professionalId set:', pro.id);

      // COLLABORATIONS
      console.log('[DB] ========================================');
      console.log('[DB] Querying project_collaborations for pro:', pro.id);
      console.log('[DB] ========================================');

      const { data: collabs, error: collabError } = await supabase
        .from('project_collaborations')
        .select(`
          *,
          project:user_projects(
            id, title, category, location, budget_total, budget_currency,
            user:users(display_name)
          )
        `)
        .eq('professional_id', pro.id)
        .order('created_at', { ascending: false });

      console.log('[DB] Collaborations result:', { count: collabs?.length, error: collabError?.message, code: collabError?.code });

      if (collabError?.code === '42501') {
        console.error('[RLS] ========================================');
        console.error('[RLS] ❌ EXPLICIT RLS on project_collaborations SELECT');
        console.error('[RLS] Fix: collab_pro_read policy (professional_id = own)');
        console.error('[RLS] ========================================');
      } else if (!collabError && (!collabs || collabs.length === 0)) {
        console.warn('[RLS] ⚠️ SILENT — 0 collaborations returned. Check table for pro_id:', pro.id);
      }

      if (collabError) { setError(collabError.message); }
      else { setCollaborations((collabs as CollaborationWithProject[]) || []); }

      setIsLoading(false);
      console.log('[FETCH] ✅ Initial load complete');
    };

    init();
  }, []);

  // ── Lazy load Tab 2: Comments ───────────────────────────────────────────────
  const loadComments = async () => {
    if (commentsLoaded || commentsLoading || !professionalId) return;

    console.log('[EFFECT] Loading comments for pro:', professionalId);
    setCommentsLoading(true);

    const supabase = createClient();

    console.log('[DB] ========================================');
    console.log('[DB] Querying realization_comments for pro:', professionalId);
    console.log('[DB] ========================================');

    const { data, error: commentsError } = await supabase
      .from('realization_comments')
      .select(`
        id, content, status, created_at, realization_id,
        realization:professional_realizations!inner(id, title),
        author:users(display_name)
      `)
      .eq('realization:professional_realizations.professional_id', professionalId)
      .order('created_at', { ascending: false });

    console.log('[DB] realization_comments result:', { count: data?.length, error: commentsError?.message, code: commentsError?.code });

    if (commentsError?.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ EXPLICIT RLS on realization_comments SELECT');
      console.error('[RLS] Fix: realization_comments_pro_read policy — migration 20260414000009');
      console.error('[RLS] ========================================');
    } else if (!commentsError && (!data || data.length === 0)) {
      console.warn('[RLS] ⚠️ SILENT or no comments yet. Pro:', professionalId);
      console.warn('[RLS] Check: realization_comments_pro_read policy is applied');
    } else {
      console.log('[DB] ✅ Comments loaded:', data?.length);
    }

    setComments(((data as unknown) as PendingComment[]) || []);
    setCommentsLoaded(true);
    setCommentsLoading(false);
  };

  // ── Lazy load Tab 3: Google Reviews ────────────────────────────────────────
  const loadGoogleReviews = async () => {
    if (googleLoaded || googleLoading || !professionalId) return;

    console.log('[EFFECT] Loading Google reviews cache for pro:', professionalId);
    setGoogleLoading(true);

    const supabase = createClient();

    console.log('[DB] ========================================');
    console.log('[DB] Querying pro_google_reviews_cache for pro:', professionalId);
    console.log('[DB] ========================================');

    const { data, error: googleError } = await supabase
      .from('pro_google_reviews_cache')
      .select('*')
      .eq('pro_id', professionalId)
      .single();

    console.log('[DB] Google reviews cache result:', {
      found: !!data,
      totalReviews: data?.total_reviews,
      rating: data?.rating,
      cachedAt: data?.cached_at,
      error: googleError?.message,
      code: googleError?.code,
    });

    if (googleError?.code === '42501') {
      console.error('[RLS] ❌ EXPLICIT RLS on pro_google_reviews_cache SELECT');
    } else if (googleError?.code === 'PGRST116') {
      console.warn('[DB] No Google reviews cache for this pro — not connected yet');
    }

    setGoogleCache(data as GoogleReviewsCache | null);
    setGoogleLoaded(true);
    setGoogleLoading(false);
  };

  // ── Inline comment moderation ───────────────────────────────────────────────
  const moderateComment = async (commentId: string, status: 'approved' | 'rejected') => {
    console.log('[ACTION] ========================================');
    console.log('[ACTION] moderateComment STARTED');
    console.log('[ACTION] commentId:', commentId, 'status:', status);
    console.log('[ACTION] ========================================');

    setModeratingId(commentId);
    console.log('[STATE] moderatingId →', commentId);

    const supabase = createClient();

    const { error } = await supabase
      .from('realization_comments')
      .update({ status })
      .eq('id', commentId);

    console.log('[DB] realization_comments UPDATE result:', { error: error?.message, code: error?.code });

    if (error?.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ EXPLICIT RLS on realization_comments UPDATE');
      console.error('[RLS] commentId:', commentId);
      console.error('[RLS] Fix: realization_comments_moderate policy (UPDATE for own realizations)');
      console.error('[RLS] ========================================');
    } else if (error) {
      console.error('[ACTION] ❌ Moderation failed (NOT RLS):', error.message);
    } else {
      console.log('[ACTION] ✅ Comment moderated:', commentId, '→', status);
      setComments(prev =>
        prev.map(c => c.id === commentId ? { ...c, status } : c)
      );
      console.log('[STATE] comments updated locally for:', commentId);
    }

    setModeratingId(null);
    console.log('[STATE] moderatingId → null');
  };

  // ── Render guards ────────────────────────────────────────────────────────────
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

  console.log('[RENDER] → Main 3-tab social inbox');

  const activeCollabs  = collaborations.filter(c => ['pending', 'negotiating', 'active'].includes(c.status));
  const archivedCollabs = collaborations.filter(c => ['declined', 'not_picked', 'terminated'].includes(c.status));

  const filteredComments = commentFilter === 'all'
    ? comments
    : comments.filter(c => c.status === commentFilter);

  const pendingCount  = collaborations.filter(c => c.status === 'pending').length;
  const commentCount  = comments.filter(c => c.status === 'pending').length;

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-4xl w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Handshake className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Boîte de réception</h1>
            <p className="text-sm text-on-surface-variant">Propositions, commentaires et avis Google</p>
          </div>
        </div>

        <Tabs
          defaultValue="proposals"
          onValueChange={(tab) => {
            console.log('[ACTION] Tab switched to:', tab);
            if (tab === 'comments') loadComments();
            if (tab === 'google') loadGoogleReviews();
          }}
        >
          <TabsList className="w-full mb-6">
            <TabsTrigger value="proposals" className="flex-1 gap-2">
              <Handshake className="w-4 h-4" />
              Propositions
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex-1 gap-2">
              <MessageCircle className="w-4 h-4" />
              Commentaires
              {commentsLoaded && commentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                  {commentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="google" className="flex-1 gap-2">
              <Star className="w-4 h-4" />
              Avis Google
            </TabsTrigger>
          </TabsList>

          {/* ── TAB 1: Propositions ─────────────────────────────────────── */}
          <TabsContent value="proposals">
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
                {activeCollabs.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                      En cours ({activeCollabs.length})
                    </h2>
                    <div className="space-y-3">
                      {activeCollabs.map(collab => (
                        <CollaborationCard key={collab.id} collab={collab} />
                      ))}
                    </div>
                  </section>
                )}
                {archivedCollabs.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                      Archivés ({archivedCollabs.length})
                    </h2>
                    <div className="space-y-3 opacity-60">
                      {archivedCollabs.map(collab => (
                        <CollaborationCard key={collab.id} collab={collab} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── TAB 2: Commentaires ─────────────────────────────────────── */}
          <TabsContent value="comments">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
              </div>
            ) : (
              <>
                {/* Filter pills */}
                <div className="flex gap-2 mb-5">
                  {(['pending', 'approved', 'all'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        console.log('[ACTION] Comment filter changed to:', f);
                        setCommentFilter(f);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        commentFilter === f
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {f === 'pending' ? `En attente${comments.filter(c => c.status === 'pending').length > 0 ? ` (${comments.filter(c => c.status === 'pending').length})` : ''}` : f === 'approved' ? 'Approuvés' : 'Tous'}
                    </button>
                  ))}
                </div>

                {filteredComments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageCircle className="w-12 h-12 text-on-surface-variant/20 mb-4" />
                    <h2 className="text-lg font-bold text-on-surface mb-1">
                      {commentFilter === 'pending' ? 'Aucun commentaire en attente' : 'Aucun commentaire'}
                    </h2>
                    <p className="text-sm text-on-surface-variant max-w-sm">
                      {commentFilter === 'pending'
                        ? 'Les nouveaux commentaires sur vos réalisations apparaîtront ici.'
                        : 'Aucun commentaire trouvé pour ce filtre.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredComments.map(comment => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        isProcessing={moderatingId === comment.id}
                        onApprove={() => moderateComment(comment.id, 'approved')}
                        onReject={() => moderateComment(comment.id, 'rejected')}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── TAB 3: Avis Google ──────────────────────────────────────── */}
          <TabsContent value="google">
            {googleLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
              </div>
            ) : !googleCache ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Star className="w-12 h-12 text-on-surface-variant/20 mb-4" />
                <h2 className="text-lg font-bold text-on-surface mb-2">Avis Google non configurés</h2>
                <p className="text-sm text-on-surface-variant max-w-sm mb-4">
                  Connectez votre profil Google Business pour voir et gérer vos avis directement ici.
                </p>
                <Link
                  href="/pro/settings"
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Configurer Google Business
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary card */}
                <div className="bg-surface-container-low rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={googleCache.rating || 0} />
                      <span className="text-2xl font-bold text-on-surface">
                        {googleCache.rating?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      {googleCache.total_reviews} avis · mis à jour{' '}
                      {formatDistanceToNow(new Date(googleCache.cached_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <a
                    href={`https://business.google.com/reviews`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => console.log('[ACTION] Opening Google Business reviews')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant/20 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Gérer sur Google
                  </a>
                </div>

                {/* Reviews feed */}
                {googleCache.reviews.length === 0 ? (
                  <p className="text-center text-sm text-on-surface-variant py-8">Aucun avis trouvé</p>
                ) : (
                  <div className="space-y-3">
                    {googleCache.reviews.map((review, i) => (
                      <GoogleReviewCard key={i} review={review} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CollaborationCard({ collab }: { collab: CollaborationWithProject }) {
  console.log('[COMPONENT] CollaborationCard render:', { id: collab.id, status: collab.status });
  const cfg = COLLAB_STATUS_CONFIG[collab.status] || COLLAB_STATUS_CONFIG['pending'];
  const project = collab.project;

  return (
    <Link
      href={`/pro/collaborations/${collab.id}`}
      className="flex items-center gap-4 bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface-container transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-on-surface truncate">
            {project?.title || 'Projet client'}
          </span>
          <Badge className={`text-xs gap-1 ${cfg.className}`}>
            {cfg.icon}
            {cfg.label}
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
          <p className="mt-1.5 text-xs text-yellow-600 font-medium">
            Invité le {new Date(collab.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — en attente de votre réponse
          </p>
        )}
        {collab.status === 'negotiating' && collab.proposal_submitted_at && (
          <p className="mt-1.5 text-xs text-purple-600">
            Proposition soumise le {new Date(collab.proposal_submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        )}
        {collab.status === 'active' && collab.started_at && (
          <p className="mt-1.5 text-xs text-green-600">
            Actif depuis le {new Date(collab.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors shrink-0" />
    </Link>
  );
}

function CommentCard({
  comment,
  isProcessing,
  onApprove,
  onReject,
}: {
  comment: PendingComment;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  console.log('[COMPONENT] CommentCard render:', { id: comment.id, status: comment.status });
  const statusCfg = COMMENT_STATUS_CONFIG[comment.status];
  const initials = comment.author?.display_name
    ? comment.author.display_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  return (
    <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-on-surface">
              {comment.author?.display_name || 'Utilisateur'}
            </span>
            <Badge className={`text-xs ${statusCfg.className}`}>{statusCfg.label}</Badge>
            <span className="text-xs text-on-surface-variant">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
            </span>
          </div>

          {comment.realization && (
            <p className="text-xs text-on-surface-variant mb-2">
              Sur : <span className="font-medium text-on-surface">{comment.realization.title}</span>
            </p>
          )}

          <p className="text-sm text-on-surface whitespace-pre-wrap">{comment.content}</p>

          {/* Actions — only show for pending */}
          {comment.status === 'pending' && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                onClick={onApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ThumbsUp className="w-3.5 h-3.5" />
                )}
                Approuver
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                onClick={onReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ThumbsDown className="w-3.5 h-3.5" />
                )}
                Rejeter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
      <div className="flex items-start gap-3">
        {review.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs font-semibold bg-yellow-100 text-yellow-700">
              {review.author_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-on-surface">{review.author_name}</span>
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-on-surface-variant">{review.relative_time_description}</span>
          </div>
          {review.text && (
            <p className="text-sm text-on-surface whitespace-pre-wrap">{review.text}</p>
          )}
          <a
            href="https://business.google.com/reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Répondre sur Google Business
          </a>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}
