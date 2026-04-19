"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProjectProList, makeFinalist, updateProjectProfessionalSelectionStatus, removeProjectProfessionalById } from "@/lib/actions/collaborations";
import type { ProListGrouped, ProjectProfessionalWithProfile } from "@/lib/types/collaborations";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Star,
  Award,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Send,
  MessageSquare,
  Eye,
  FileText,
  Clock,
  Bell,
  Handshake,
  Trash2,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// STATUS BADGE CONFIG
// ============================================

const STATUS_BADGE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string; icon?: React.ReactNode }> = {
  candidate: {
    label: "Sauvegardé",
    variant: "outline",
    className: "bg-surface-container text-on-surface-variant",
  },
  shortlisted: {
    label: "Shortlisté",
    variant: "secondary",
    className: "bg-blue-100 text-blue-700",
  },
  "finalist-no-response": {
    label: "En attente",
    variant: "outline",
    className: "bg-yellow-100 text-yellow-700",
  },
  "finalist-proposal": {
    label: "Proposition soumise",
    variant: "default",
    className: "bg-green-100 text-green-700",
  },
  "finalist-negotiating": {
    label: "Négociation",
    variant: "secondary",
    className: "bg-purple-100 text-purple-700",
  },
  agreed: {
    label: "Actif",
    variant: "default",
    className: "bg-green-500 text-white",
  },
  declined: {
    label: "Refusé",
    variant: "destructive",
    className: "bg-red-100 text-red-700",
  },
};

// ============================================
// SECTION CONFIG
// ============================================

const SECTION_CONFIG: Record<keyof ProListGrouped, { title: string; icon: React.ReactNode; defaultCollapsed: boolean; color: string }> = {
  saved: {
    title: "SAUVEGARDÉS",
    icon: <Users className="w-4 h-4" />,
    defaultCollapsed: false,
    color: "text-on-surface-variant",
  },
  shortlisted: {
    title: "SHORTLISTÉS",
    icon: <Star className="w-4 h-4" />,
    defaultCollapsed: false,
    color: "text-blue-600",
  },
  finalists: {
    title: "FINALISTES — PHASE PROPOSITION",
    icon: <Award className="w-4 h-4" />,
    defaultCollapsed: false,
    color: "text-yellow-600",
  },
  active: {
    title: "SÉLECTIONNÉ — ACTIF",
    icon: <CheckCircle2 className="w-4 h-4" />,
    defaultCollapsed: false,
    color: "text-green-600",
  },
  declined: {
    title: "REFUSÉS",
    icon: <XCircle className="w-4 h-4" />,
    defaultCollapsed: true,
    color: "text-red-600",
  },
};

// ============================================
// HELPER: Get pro status badge
// ============================================

function getProStatusBadge(pro: ProjectProfessionalWithProfile) {
  const selectionStatus = pro.selection_status;
  const collab = pro.collaboration;

  console.log('[Component] getProStatusBadge:', { 
    id: pro.id, 
    status: selectionStatus, 
    hasCollab: !!collab,
    isExternal: pro.is_external 
  });

  if (selectionStatus === "candidate") {
    return STATUS_BADGE_CONFIG["candidate"];
  }
  if (selectionStatus === "shortlisted") {
    return STATUS_BADGE_CONFIG["shortlisted"];
  }
  if (selectionStatus === "finalist") {
    if (!collab?.proposal_submitted_at) {
      return STATUS_BADGE_CONFIG["finalist-no-response"];
    }
    if (collab.status === "negotiating") {
      return STATUS_BADGE_CONFIG["finalist-negotiating"];
    }
    return STATUS_BADGE_CONFIG["finalist-proposal"];
  }
  if (selectionStatus === "agreed") {
    return STATUS_BADGE_CONFIG["agreed"];
  }
  if (selectionStatus === "not_selected") {
    return STATUS_BADGE_CONFIG["declined"];
  }

  return STATUS_BADGE_CONFIG["candidate"];
}

// ============================================
// PRO CARD COMPONENT
// ============================================

function ProCard({
  pro,
  section,
  onStatusChange,
  onRemove,
}: {
  pro: ProjectProfessionalWithProfile;
  section: string;
  onStatusChange: (ppId: string, status: string) => Promise<void>;
  onRemove: (ppId: string) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const professional = pro.professional;
  const collab = pro.collaboration;

  const displayName = pro.is_external 
    ? (pro.external_name || "Professionnel Externe") 
    : (professional?.business_name || "Professionnel");

  console.log("[ProCard] Render:", { 
    id: pro.id,
    name: displayName, 
    isExternal: pro.is_external,
    section 
  });

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";

  const rating = professional?.avg_rating;
  const reviewCount = professional?.review_count || 0;
  
  const category = pro.is_external ? pro.external_category : professional?.category;
  const location = pro.is_external ? pro.external_location : professional?.city;

  return (
    <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar size="lg" className="shrink-0">
          {professional?.profile_picture_url ? (
            <AvatarImage src={professional.profile_picture_url} alt={displayName} />
          ) : null}
          <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {collab ? (
              <Link 
                href={`/projets/${pro.project_id}/pros/proposal/${pro.professional_id}`}
                className="text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate"
              >
                {displayName}
              </Link>
            ) : !pro.is_external && professional?.slug ? (
              <Link 
                href={`/professionnels/${professional.slug}`}
                className="text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate"
              >
                {displayName}
              </Link>
            ) : (
              <h4 className="text-sm font-semibold text-on-surface truncate">
                {displayName}
              </h4>
            )}
            {pro.is_external && (
              <Badge variant="outline" className="bg-surface-container-high text-on-surface-variant text-[10px] py-0 h-5">
                Externe
              </Badge>
            )}
            {(() => {
              const badge = getProStatusBadge(pro);
              return (
                <Badge variant={badge.variant} className={badge.className}>
                  {badge.icon}
                  {badge.label}
                </Badge>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-on-surface-variant">
            {category && (
              <span className="capitalize">{category}</span>
            )}
            {location && (
              <>
                <span>•</span>
                <span>{location}</span>
              </>
            )}
            {!pro.is_external && rating && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)} ({reviewCount})
                </span>
              </>
            )}
          </div>

          {/* Proposal status for finalists */}
          {section === "finalists" && collab && (
            <div className="mt-2 text-xs flex items-center gap-1.5">
              {collab.proposal_submitted_at ? (
                collab.status === "negotiating" ? (
                  <span className="text-purple-600 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Négociation en cours
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Proposition soumise
                  </span>
                )
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  En attente de réponse
                </span>
              )}
            </div>
          )}

          {/* Active pro info */}
          {section === "active" && collab?.started_at && (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Actif depuis {new Date(collab.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              <span className="text-on-surface-variant ml-1">• Accès complet</span>
            </div>
          )}
        </div>

        {/* Status Dropdown and Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Select
            disabled={isUpdating}
            value={pro.selection_status}
            onValueChange={async (val) => {
              if (val) {
                setIsUpdating(true);
                await onStatusChange(pro.id, val);
                setIsUpdating(false);
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs min-w-[130px] bg-surface-container-high border-outline-variant/20 hover:border-outline-variant/50">
              <SelectValue placeholder="Changer d'état" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="candidate">Sauvegardé</SelectItem>
              <SelectItem value="shortlisted">Shortlisté</SelectItem>
              <SelectItem value="finalist" disabled={pro.is_external}>Rendre finaliste</SelectItem>
              <SelectItem value="agreed">Sélectionner (Actif)</SelectItem>
              <SelectItem value="not_selected">Refuser</SelectItem>
            </SelectContent>
          </Select>

          <button
            title="Retirer du projet"
            disabled={isUpdating}
            onClick={async () => {
              if (confirm("Voulez-vous vraiment retirer ce professionnel du projet ? Cela annulera également toute collaboration en cours.")) {
                setIsUpdating(true);
                await onRemove(pro.id);
                setIsUpdating(false);
              }
            }}
            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors border border-transparent hover:border-error/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Specific Step Content / Links */}
      {(section === "finalists" || section === "active" || section === "declined") && (
        <div className="mt-4 pt-3 border-t border-outline-variant/10 flex flex-wrap gap-2">
          {section === "finalists" && (
            <>
              {collab?.proposal_submitted_at ? (
                <>
                  <Link
                    href={`/projets/${pro.project_id}/pros/proposal/${pro.professional_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Voir la proposition
                  </Link>
                  <button
                    onClick={() => {
                      toast.info("Demander un changement — fonctionnalité à venir");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-xs font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Demander révision
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/projets/${pro.project_id}/pros/proposal/${pro.professional_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-xs font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Voir la discussion
                  </Link>
                  <button
                    onClick={() => {
                      toast.info("Envoyer un rappel — fonctionnalité à venir");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container/50 text-on-surface-variant/70 rounded-lg text-xs font-medium hover:bg-surface-container transition-colors"
                  >
                    <Bell className="w-3 h-3" />
                    Envoyer un rappel
                  </button>
                </>
              )}
            </>
          )}

          {section === "active" && (
            <>
              <Link
                href={`/projets/${pro.project_id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Eye className="w-3 h-3" />
                Voir l&apos;activité
              </Link>
              {collab?.proposal_submitted_at && (
                <Link
                  href={`/projets/${pro.project_id}/pros/proposal/${pro.professional_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-xs font-medium hover:bg-surface-container-high transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Voir la proposition
                </Link>
              )}
            </>
          )}

          {section === "declined" && !pro.is_external && (
            <Link
              href={`/professionnels/${professional?.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-xs font-medium hover:bg-surface-container-high transition-colors"
            >
              <Eye className="w-3 h-3" />
              Voir le profil
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTION COMPONENT
// ============================================

function ProSection({
  section,
  group,
  collapsed,
  onToggle,
  onStatusChange,
  onRemove,
}: {
  section: string;
  group: ProListGrouped[keyof ProListGrouped];
  collapsed: boolean;
  onToggle: () => void;
  onStatusChange: (ppId: string, status: string) => Promise<void>;
  onRemove: (ppId: string) => Promise<void>;
}) {
  console.log("[ProSection] Render, section:", section, "count:", group.count, "collapsed:", collapsed);

  const config = SECTION_CONFIG[section as keyof typeof SECTION_CONFIG];
  if (group.count === 0 || !config) return null;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-2 text-sm font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
      >
        <span className={config.color}>{config.icon}</span>
        <span className={config.color}>{config.title}</span>
        <span className="text-on-surface-variant font-normal normal-case tracking-normal">({group.count})</span>
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-on-surface-variant ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 text-on-surface-variant ml-auto" />
        )}
      </button>

      {/* Section Content */}
      {!collapsed && (
        <div className="space-y-3">
          {group.pros.map((pro: ProjectProfessionalWithProfile) => (
            <ProCard
              key={pro.id}
              pro={pro}
              section={section}
              onStatusChange={onStatusChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PRO LIST PAGE
// ============================================

export function ProListPage() {
  const { id } = useParams();
  const projectId = Array.isArray(id) ? id[0] : id || "";
  const router = useRouter();

  const [groups, setGroups] = useState<ProListGrouped | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    declined: true,
  });

  console.log('[COMPONENT] ========================================');
  console.log('[COMPONENT] ProListPage RENDER');
  console.log('[COMPONENT] projectId:', projectId, 'isLoading:', isLoading, 'groups:', !!groups);
  console.log('[COMPONENT] ========================================');

  const loadProList = useCallback(async () => {
    console.log('[EFFECT] ========================================');
    console.log('[EFFECT] loadProList triggered, projectId:', projectId);
    console.log('[EFFECT] ========================================');
    setIsLoading(true);

    const result = await getProjectProList(projectId);

    console.log('[DB] getProjectProList result:', {
      hasGroups: !!result.groups,
      saved: result.groups?.saved.count,
      shortlisted: result.groups?.shortlisted.count,
      finalists: result.groups?.finalists.count,
      active: result.groups?.active.count,
      declined: result.groups?.declined.count,
      error: result.error,
    });

    if (result.error) {
      console.error('[DB] ❌ getProjectProList error:', result.error);
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    if (result.groups) {
      setGroups(result.groups as unknown as import("@/lib/types/collaborations").ProListGrouped);

      // Extract project title from first pro's project data (if available)
      const firstPro =
        result.groups.saved.pros[0] ||
        result.groups.shortlisted.pros[0] ||
        result.groups.finalists.pros[0] ||
        result.groups.active.pros[0] ||
        result.groups.declined.pros[0];

      if (firstPro) {
        // We'll set title from the project fetch
      }
    }

    if (!result.groups ||
      (result.groups.saved.count === 0 &&
        result.groups.shortlisted.count === 0 &&
        result.groups.finalists.count === 0 &&
        result.groups.active.count === 0 &&
        result.groups.declined.count === 0)) {
      console.warn('[RLS] ========================================');
      console.warn('[RLS] ⚠️ SILENT RLS FILTERING — getProjectProList returned 0 total pros');
      console.warn('[RLS] Table: project_professionals');
      console.warn('[RLS] projectId:', projectId);
      console.warn('[RLS] Could be: no pros added yet, or RLS silently filtering');
      console.warn('[RLS] Verify: check Supabase table editor for rows with this project_id');
      console.warn('[RLS] ========================================');
    } else {
      console.log('[DB] ✅ Pro list loaded successfully');
    }

    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (projectId) loadProList();
  }, [projectId, loadProList]);

  // Fetch project title
  useEffect(() => {
    if (!projectId) return;

    const fetchProjectTitle = async () => {
      console.log('[FETCH] Fetching project title, projectId:', projectId);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("user_projects")
        .select("title")
        .eq("id", projectId)
        .single();

      console.log('[DB] user_projects title result:', { title: data?.title, error: error?.message, code: error?.code });

      if (error?.code === '42501') {
        console.error('[RLS] ========================================');
        console.error('[RLS] ❌ EXPLICIT RLS BLOCKING!');
        console.error('[RLS] Table: user_projects');
        console.error('[RLS] Operation: SELECT (title)');
        console.error('[RLS] projectId:', projectId);
        console.error('[RLS] Fix: Ensure client owns the project (user_id = auth.uid())');
        console.error('[RLS] ========================================');
      } else if (!error && !data) {
        console.warn('[RLS] ⚠️ SILENT RLS FILTERING — user_projects returned null');
        console.warn('[RLS] Table: user_projects, projectId:', projectId);
        console.warn('[RLS] Verify: check if this project exists in Supabase table editor');
      } else if (data?.title) {
        console.log('[FETCH] ✅ Project title:', data.title);
        setProjectTitle(data.title);
      }
    };

    fetchProjectTitle();
  }, [projectId]);

  const handleStatusChange = async (ppId: string, status: string) => {
    console.log('[ACTION] handleStatusChange:', { ppId, status });
    const result = await updateProjectProfessionalSelectionStatus(ppId, status, projectId);
    
    if (result.success) {
      toast.success("Statut mis à jour");
      loadProList();
    } else {
      toast.error(result.error || "Erreur lors de la mise à jour");
    }
  };

  const handleRemove = async (ppId: string) => {
    console.log('[ACTION] handleRemove:', { ppId });
    const result = await removeProjectProfessionalById(ppId, projectId);
    
    if (result.success) {
      toast.success("Professionnel retiré du projet");
      loadProList();
    } else {
      toast.error(result.error || "Erreur lors du retrait");
    }
  };

  const toggleSection = (section: string) => {
    console.log("[ProListPage] toggleSection:", section);
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  console.log('[RENDER] State:', { isLoading, hasGroups: !!groups, projectTitle });

  if (isLoading) {
    console.log('[RENDER] → Skeleton loading state');
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface-container-low rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-4 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!groups) {
    console.warn('[RENDER] → Empty state (no groups — possible first load or RLS issue)');
    return (
      <div className="text-center py-16 bg-surface-container-low rounded-2xl">
        <Users className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
        <h3 className="text-lg font-semibold text-on-surface mb-2">Aucun professionnel</h3>
        <p className="text-sm text-on-surface-variant">
          Sauvegardez des professionnels pour commencer à les comparer.
        </p>
      </div>
    );
  }

  const totalCount =
    groups.saved.count +
    groups.shortlisted.count +
    groups.finalists.count +
    groups.active.count +
    groups.declined.count;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-4">
          <Link href="/projets" className="hover:text-primary transition-colors">
            Mes projets
          </Link>
          <span className="opacity-30">/</span>
          <Link href={`/projets/${projectId}`} className="hover:text-primary transition-colors truncate">
            {projectTitle || "Projet"}
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-primary">Professionnels</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">
              {projectTitle || "Projet"}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {totalCount} professionnel{totalCount > 1 ? "s" : ""} • Gérez votre processus de sélection
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Saved */}
        <ProSection
          section="saved"
          group={groups.saved}
          collapsed={!!collapsedSections.saved}
          onToggle={() => toggleSection("saved")}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />

        {/* Shortlisted */}
        <ProSection
          section="shortlisted"
          group={groups.shortlisted}
          collapsed={!!collapsedSections.shortlisted}
          onToggle={() => toggleSection("shortlisted")}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />

        {/* Finalists */}
        <ProSection
          section="finalists"
          group={groups.finalists}
          collapsed={!!collapsedSections.finalists}
          onToggle={() => toggleSection("finalists")}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />

        {/* Active */}
        <ProSection
          section="active"
          group={groups.active}
          collapsed={!!collapsedSections.active}
          onToggle={() => toggleSection("active")}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />

        {/* Declined */}
        <ProSection
          section="declined"
          group={groups.declined}
          collapsed={!!collapsedSections.declined}
          onToggle={() => toggleSection("declined")}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl">
          <Users className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="text-lg font-semibold text-on-surface mb-2">Aucun professionnel</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            Explorez les professionnels et sauvegardez ceux qui vous intéressent.
          </p>
          <Link
            href="/professionnels"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Explorer les professionnels
          </Link>
        </div>
      )}
    </div>
  );
}
