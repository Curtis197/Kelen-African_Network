"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  submitProposal,
  declineCollaboration,
  sendCollaborationMessage,
} from "@/lib/actions/collaborations";
import type {
  ProjectCollaboration,
  CollaborationMessage,
  ProposalFormData,
} from "@/lib/types/collaborations";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Send,
  ChevronRight,
  Handshake,
  Loader2,
  Paperclip,
  File,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/supabase/storage";
import { useRef } from "react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:     { label: "Invitation en attente",   className: "bg-yellow-100 text-yellow-700" },
  negotiating: { label: "Proposition soumise",     className: "bg-purple-100 text-purple-700" },
  active:      { label: "Collaboration active",    className: "bg-green-500 text-white" },
  declined:    { label: "Refusé",                  className: "bg-red-100 text-red-700" },
  not_picked:  { label: "Non retenu",              className: "bg-surface-container text-on-surface-variant" },
  terminated:  { label: "Terminé",                 className: "bg-surface-container text-on-surface-variant" },
};

type FullCollaboration = Omit<ProjectCollaboration, 'project' | 'messages'> & {
  project: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    location: string | null;
    budget_total: number | null;
    budget_currency: string | null;
    areas: { id: string; name: string }[];
    steps: { id: string; title: string; budget: number | null; status: string }[];
    user: { display_name: string; email: string } | null;
  } | null;
  messages: CollaborationMessage[];
};

export default function ProCollaborationDetailPage() {
  const { id: collaborationId } = useParams();
  const collabIdStr = Array.isArray(collaborationId) ? collaborationId[0] : collaborationId || '';
  const router = useRouter();


  const [collab, setCollab]               = useState<FullCollaboration | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [replyText, setReplyText]         = useState('');
  const [attachments, setAttachments]     = useState<{ url: string; name: string; type: string }[]>([]);
  const [isUploading, setIsUploading]     = useState(false);
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const [proposal, setProposal]           = useState<ProposalFormData>({
    text: '', budget: 0, currency: 'XOF', timeline: '',
  });


  // â”€â”€ DATA FETCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!collabIdStr) {
      return;
    }


    const fetchCollab = async () => {
      const supabase = createClient();

      // â”€â”€ AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setIsLoading(false);
        return;
      }

      // â”€â”€ COLLABORATION + PROJECT + MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

      const { data, error } = await supabase
        .from('project_collaborations')
        .select(`
          *,
          project:user_projects(
            id,
            title,
            description,
            category,
            location,
            budget_total,
            budget_currency,
            areas:project_areas(id, name),
            steps:project_steps(id, title, budget, status),
            user:users(display_name, email)
          ),
          messages:collaboration_messages(*)
        `)
        .eq('id', collabIdStr)
        .order('created_at', { ascending: true, referencedTable: 'collaboration_messages' })
        .single();


      // â”€â”€ RLS DETECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (error) {
        if (error.code === '42501') {
          toast.error('Accès refusé â€” politique RLS');
        } else if (error.code === 'PGRST116') {
          toast.error('Collaboration introuvable');
        } else {
          toast.error('Impossible de charger la collaboration');
        }
        setIsLoading(false);
        return;
      }

      if (!data) {
        toast.error('Collaboration introuvable');
        setIsLoading(false);
        return;
      }


      setCollab(data as FullCollaboration);
      setIsLoading(false);

    };

    fetchCollab();
  }, [collabIdStr]);

  // â”€â”€ ACTION: SUBMIT PROPOSAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmitProposal = async () => {

    if (!proposal.text.trim() || !proposal.timeline.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    const result = await submitProposal(collabIdStr, proposal);


    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Proposition soumise avec succès !');
      setShowProposalForm(false);
      setTimeout(() => window.location.reload(), 500);
    }

    setIsSubmitting(false);
  };

  // â”€â”€ ACTION: DECLINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDecline = () => {
    const doDecline = async () => {
      setIsSubmitting(true);
      const result = await declineCollaboration(collabIdStr, 'Refusé par le professionnel');
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Invitation refusée.');
        router.push('/pro/collaborations');
      }
      setIsSubmitting(false);
    };

    toast("Refuser cette invitation ?", {
      description: "Cette action est irréversible.",
      action: { label: "Refuser", onClick: doDecline },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  // â”€â”€ ATTACHMENT LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const file = files[0]; // Instant upload handle one by one for better UX
      
      const bucket = "collaboration-attachments";
      // Using professional_id (user id) in path for organization
      const path = `pro/${Date.now()}`; 
      
      const publicUrl = await uploadFile(file, bucket, path);
      
      setAttachments(prev => [...prev, {
        url: publicUrl,
        name: file.name,
        type: file.type
      }]);
      
      toast.success("Fichier ajouté");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du fichier");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // â”€â”€ ACTION: SEND MESSAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSendMessage = async () => {

    if (!replyText.trim()) {
      return;
    }

    setIsSubmitting(true);

    const result = await sendCollaborationMessage(collabIdStr, {
      type: 'general',
      content: replyText.trim(),
      attachments: attachments,
    }, 'professional');


    if (result.error) {
      toast.error(result.error);
    } else {
      setReplyText('');
      setAttachments([]);
      if ((result as { data?: CollaborationMessage }).data) {
        setCollab(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            messages: [...(prev.messages || []), (result as { data: CollaborationMessage }).data],
          };
          return updated;
        });
      }
    }

    setIsSubmitting(false);
  };

  // â”€â”€ RENDER GUARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!collab) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
        <Handshake className="w-12 h-12 text-on-surface-variant/40 mb-4" />
        <h1 className="text-2xl font-bold text-on-surface mb-2">Collaboration introuvable</h1>
        <p className="text-sm text-on-surface-variant mb-4">
          Vérifiez l'URL ou consultez vos collaborations.
        </p>
        <Link href="/pro/collaborations" className="text-primary font-semibold hover:underline">
          ← Retour aux collaborations
        </Link>
      </div>
    );
  }

  const statusCfg  = STATUS_CONFIG[collab.status] || STATUS_CONFIG['pending'];
  const project    = collab.project;
  const messages   = collab.messages || [];
  const isPending    = collab.status === 'pending';
  const isNegotiating = collab.status === 'negotiating';
  const isActive   = collab.status === 'active';
  const isArchived = ['declined', 'not_picked', 'terminated'].includes(collab.status);
  const canAct     = isPending || isNegotiating;


  return (
    <main className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-4xl w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-6">
          <Link href="/pro/collaborations" className="hover:text-primary transition-colors">
            Collaborations
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-primary truncate">{project?.title || 'Détail'}</span>
        </nav>

        <Link
          href="/pro/collaborations"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux collaborations
        </Link>

        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
          isActive      ? 'bg-green-50 border border-green-200' :
          isPending     ? 'bg-yellow-50 border border-yellow-200' :
          isNegotiating ? 'bg-purple-50 border border-purple-200' :
          'bg-surface-container border border-outline-variant/20'
        }`}>
          <Handshake className={`w-5 h-5 shrink-0 ${
            isActive      ? 'text-green-600' :
            isPending     ? 'text-yellow-600' :
            isNegotiating ? 'text-purple-600' :
            'text-on-surface-variant'
          }`} />
          <div>
            <div className="font-semibold text-sm text-on-surface">{statusCfg.label}</div>
            {isPending && (
              <div className="text-xs text-on-surface-variant mt-0.5">
                Invitation reçue le {new Date(collab.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            {isActive && collab.started_at && (
              <div className="text-xs text-green-600 mt-0.5">
                Depuis le {new Date(collab.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* Project Details (read-only) */}
        {project && (
          <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-on-surface mb-1">{project.title}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant mb-4">
              {project.category && <span className="capitalize">{project.category}</span>}
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{project.location}
                </span>
              )}
              {project.budget_total && (
                <span className="flex items-center gap-1 font-semibold text-on-surface">
                  <DollarSign className="w-3.5 h-3.5" />
                  {project.budget_total.toLocaleString('fr-FR')} {project.budget_currency || 'XOF'}
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-sm text-on-surface-variant whitespace-pre-wrap mb-4">
                {project.description}
              </p>
            )}

            {/* Steps */}
            {project.steps?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-on-surface mb-2">Étapes du projet</h3>
                <div className="space-y-2">
                  {project.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-on-surface">{step.title}</span>
                      {step.budget && (
                        <span className="text-on-surface-variant text-xs">
                          {step.budget.toLocaleString('fr-FR')} {project.budget_currency || 'XOF'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas */}
            {project.areas?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-2">Zones / périmètres</h3>
                <div className="flex flex-wrap gap-2">
                  {project.areas.map(area => (
                    <span key={area.id} className="px-3 py-1 bg-surface-container rounded-full text-xs text-on-surface-variant">
                      {area.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing Proposal */}
        {collab.proposal_submitted_at && (
          <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />Votre proposition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {collab.proposal_budget && (
                <div className="bg-surface-container rounded-xl p-4">
                  <div className="text-xs text-on-surface-variant mb-1">Budget proposé</div>
                  <div className="text-xl font-bold text-on-surface">
                    {collab.proposal_budget.toLocaleString('fr-FR')} {collab.proposal_currency || 'XOF'}
                  </div>
                </div>
              )}
              {collab.proposal_timeline && (
                <div className="bg-surface-container rounded-xl p-4">
                  <div className="text-xs text-on-surface-variant mb-1">Durée estimée</div>
                  <div className="text-xl font-bold text-on-surface">{collab.proposal_timeline}</div>
                </div>
              )}
            </div>
            {collab.proposal_text && (
              <div className="bg-surface-container rounded-xl p-4 text-sm text-on-surface whitespace-pre-wrap">
                {collab.proposal_text}
              </div>
            )}
          </div>
        )}

        {/* Message Thread */}
        {messages.length > 0 && (
          <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />Fil de discussion ({messages.length})
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_role === 'professional' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] sm:max-w-[80%] rounded-xl p-3 sm:p-4 ${
                    msg.sender_role === 'professional'
                      ? 'bg-primary/10 text-on-surface'
                      : 'bg-surface-container text-on-surface'
                  }`}>
                    <div className="text-xs text-on-surface-variant mb-1">
                      {msg.sender_role === 'professional' ? 'Vous' : project?.user?.display_name || 'Client'}
                      {msg.message_type !== 'general' && (
                        <Badge className="ml-2 bg-surface-container-high text-on-surface-variant text-[10px]">
                          {msg.message_type === 'proposal'          && 'Proposition'}
                          {msg.message_type === 'revision_request'  && 'Demande de révision'}
                          {msg.message_type === 'counter_offer'     && 'Contre-offre'}
                          {msg.message_type === 'acceptance'        && 'Acceptation'}
                          {msg.message_type === 'decline'           && 'Refus'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>

                    {/* Render Attachments */}
                    {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-current/10 pt-2">
                        {msg.attachments.map((att: any, idx: number) => {
                          const isImg = att.type?.startsWith('image/');
                          return (
                            <a 
                              key={idx} 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group relative flex items-center gap-2 bg-black/5 hover:bg-black/10 rounded-lg p-2 transition-colors overflow-hidden max-w-[200px]"
                            >
                              {isImg ? (
                                <div className="relative w-8 h-8 shrink-0 overflow-hidden rounded">
                                  <Image
                                    src={att.url}
                                    alt={att.name}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                  />
                                </div>
                              ) : (
                                <File className="w-6 h-6 opacity-40 shrink-0" />
                              )}
                              <span className="text-[10px] truncate font-medium opacity-70 group-hover:opacity-100">
                                {att.name}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-xs text-on-surface-variant/60 mt-2">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            {!isArchived && (
              <div className="space-y-4">
                {/* Attachment Previews */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative group">
                        <div className="bg-surface-container-high rounded-lg p-2 flex items-center gap-2 pr-8 animate-in fade-in slide-in-from-bottom-2">
                          {att.type.startsWith('image/') ? (
                            <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded">
                              <Image
                                src={att.url}
                                alt={att.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <File className="w-10 h-10 text-on-surface-variant/40" />
                          )}
                          <div className="text-[10px] max-w-[100px] truncate font-medium">
                            {att.name}
                          </div>
                          <button
                            onClick={() => removeAttachment(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {isUploading && (
                      <div className="bg-surface-container-high rounded-lg p-2 flex items-center gap-2 h-[56px] min-w-[100px] animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin opacity-40" />
                        <span className="text-[10px] opacity-40">Chargement...</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <textarea
                      value={replyText}
                      onChange={e => {
                        setReplyText(e.target.value);
                      }}
                      placeholder="Votre message..."
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary/50 pr-12 min-h-[100px]"
                      rows={3}
                    />
                    
                    {/* Hidden Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      accept="image/*,application/pdf"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isSubmitting}
                      className="absolute right-3 bottom-3 p-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant rounded-lg transition-colors disabled:opacity-50"
                      title="Ajouter un document ou une image"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={(!replyText.trim() && attachments.length === 0) || isSubmitting || isUploading}
                    className="self-end px-4 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed h-12 sm:h-[100px] inline-flex items-center justify-center min-w-[56px]"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No messages yet but active collaboration â€” show reply box */}
        {messages.length === 0 && !isArchived && (
          <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />Message au client
            </h2>
            <div className="space-y-4">
              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      <div className="bg-surface-container-high rounded-lg p-2 flex items-center gap-2 pr-8 animate-in fade-in slide-in-from-bottom-2">
                        {att.type.startsWith('image/') ? (
                          <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded">
                            <Image
                              src={att.url}
                              alt={att.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <File className="w-10 h-10 text-on-surface-variant/40" />
                        )}
                        <div className="text-[10px] max-w-[100px] truncate font-medium">
                          {att.name}
                        </div>
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {isUploading && (
                    <div className="bg-surface-container-high rounded-lg p-2 flex items-center gap-2 h-[56px] min-w-[100px] animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin opacity-40" />
                      <span className="text-[10px] opacity-40">Chargement...</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Votre message..."
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary/50 pr-12 min-h-[100px]"
                    rows={3}
                  />
                  
                  {/* Hidden Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isSubmitting}
                    className="absolute right-3 bottom-3 p-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant rounded-lg transition-colors disabled:opacity-50"
                    title="Ajouter un document ou une image"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={(!replyText.trim() && attachments.length === 0) || isSubmitting || isUploading}
                  className="self-end px-4 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed h-12 sm:h-[100px] inline-flex items-center justify-center min-w-[56px]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROPOSAL FORM */}
        {canAct && !collab.proposal_submitted_at && (
          <div className="mb-6">
            {!showProposalForm ? (
              <button
                onClick={() => {
                  setShowProposalForm(true);
                }}
                className="w-full flex items-center justify-between bg-primary text-on-primary rounded-2xl px-6 py-4 font-semibold hover:opacity-90 transition-opacity"
              >
                <span>Soumettre votre proposition</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="bg-surface-container-low rounded-2xl p-6">
                <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />Votre proposition
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1.5">Budget proposé</label>
                      <input
                        type="number"
                        value={proposal.budget || ''}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setProposal(prev => ({ ...prev, budget: val }));
                        }}
                        placeholder="25000000"
                        className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1.5">Durée estimée *</label>
                      <input
                        type="text"
                        value={proposal.timeline}
                        onChange={e => {
                          setProposal(prev => ({ ...prev, timeline: e.target.value }));
                        }}
                        placeholder="ex: 4 mois"
                        className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Votre approche et conditions *</label>
                    <textarea
                      value={proposal.text}
                      onChange={e => {
                        setProposal(prev => ({ ...prev, text: e.target.value }));
                      }}
                      placeholder="Décrivez votre approche, vos méthodes, vos conditions..."
                      rows={6}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitProposal}
                      disabled={isSubmitting || !proposal.text.trim() || !proposal.timeline.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Soumettre la proposition
                    </button>
                    <button
                      onClick={() => {
                        setShowProposalForm(false);
                      }}
                      className="px-6 py-3 bg-surface-container text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Project Link */}
        {isActive && project && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-green-700">Vous avez accès au projet</h3>
            <p className="text-sm text-green-600 mt-1 mb-4">
              Vous pouvez créer des journaux, uploader des médias et gérer les documents.
            </p>
            <Link
              href={`/projets/${project.id}`}
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              Voir le projet
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Decline Button */}
        {canAct && (
          <button
            onClick={handleDecline}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
          >
            <XCircle className="w-4 h-4" />
            Refuser cette invitation
          </button>
        )}

        {/* Archived notice */}
        {isArchived && (
          <div className="bg-surface-container rounded-xl p-4 text-center text-sm text-on-surface-variant">
            Cette collaboration est archivée.
          </div>
        )}

      </div>
    </main>
  );
}
