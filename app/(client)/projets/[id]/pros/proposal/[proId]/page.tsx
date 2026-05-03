"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { acceptProposal, declineFinalist, requestRevision } from "@/lib/actions/collaborations";
import type { ProjectCollaboration, ProfessionalSnapshot, CollaborationMessage } from "@/lib/types/collaborations";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  Paperclip,
  File,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/supabase/storage";
import { useRef } from "react";

const STATUS_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  negotiating: { label: "Négociation", className: "bg-purple-100 text-purple-700" },
  active: { label: "Actif", className: "bg-green-500 text-white" },
};

export default function ProposalReviewPage() {
  const { id: projectId, proId } = useParams();
  const projectIdStr = Array.isArray(projectId) ? projectId[0] : projectId || "";
  const proIdStr = Array.isArray(proId) ? proId[0] : proId || "";
  const router = useRouter();

  const [collaboration, setCollaboration] = useState<ProjectCollaboration | null>(null);
  const [professional, setProfessional] = useState<ProfessionalSnapshot | null>(null);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [attachments, setAttachments] = useState<{ url: string; name: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!projectIdStr || !proIdStr) {
      return;
    }


    const fetchProposal = async () => {
      setIsLoading(true);

      const supabase = createClient();

      // â”€â”€ COLLABORATION + PROFESSIONAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

      const { data: collabData, error: collabError } = await supabase
        .from("project_collaborations")
        .select(`
          *,
          professional:professionals(
            id,
            business_name,
            category,
            subcategories,
            city,
            country,
            profile_picture_url,
            avg_rating,
            review_count
          )
        `)
        .eq("project_id", projectIdStr)
        .eq("professional_id", proIdStr)
        .single();


      if (collabError) {
        if (collabError.code === "42501") {
        } else if (collabError.code === 'PGRST116') {
        } else {
        }
        toast.error("Impossible de charger la proposition");
        setIsLoading(false);
        return;
      }

      if (!collabData) {
        toast.error("Proposition introuvable");
        setIsLoading(false);
        return;
      }

      setCollaboration(collabData);
      if (collabData.professional) {
        setProfessional(collabData.professional as ProfessionalSnapshot);
      }

      // â”€â”€ MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

      const { data: messagesData, error: messagesError } = await supabase
        .from("collaboration_messages")
        .select("*")
        .eq("collaboration_id", collabData.id)
        .order("created_at", { ascending: true });


      if (messagesError?.code === "42501") {
      } else if (!messagesError && (!messagesData || messagesData.length === 0)) {
      } else if (messagesData) {
        setMessages(messagesData as CollaborationMessage[]);
      }

      setIsLoading(false);
    };

    fetchProposal();
  }, [projectIdStr, proIdStr]);

  const handleAccept = async () => {
    if (!collaboration) return;


    if (!confirm("Accepter cette proposition ? Les autres finalistes seront automatiquement refusés.")) {
      return;
    }

    setIsSubmitting(true);

    const result = await acceptProposal(collaboration.id);


    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Proposition acceptée ! Le professionnel a maintenant accès au projet.");
      router.push(`/projets/${projectIdStr}/pros`);
    }
    setIsSubmitting(false);
  };

  const handleDecline = async () => {
    if (!collaboration) return;


    const reason = prompt("Raison du refus (optionnel) :");
    if (reason === null) {
      return;
    }

    setIsSubmitting(true);

    const result = await declineFinalist(collaboration.id, reason || "Non sélectionné");


    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Professionnel refusé.");
      router.push(`/projets/${projectIdStr}/pros`);
    }
    setIsSubmitting(false);
  };

  const handleRequestRevision = async () => {
    if (!collaboration) return;


    const message = prompt("Votre demande de révision :");
    if (!message) {
      return;
    }

    setIsSubmitting(true);

    const result = await requestRevision(collaboration.id, message);


    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Demande de révision envoyée.");

      const supabase = createClient();
      const { data, error: reloadError } = await supabase
        .from("collaboration_messages")
        .select("*")
        .eq("collaboration_id", collaboration.id)
        .order("created_at", { ascending: true });

      if (reloadError?.code === '42501') {
      }
      if (data) {
        setMessages(data as CollaborationMessage[]);
      }
    }
    setIsSubmitting(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const file = files[0]; // Instant upload handle one by one for better UX
      
      const bucket = "collaboration-attachments";
      const path = `${proIdStr}/${Date.now()}`;
      
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

  const handleSendReply = async () => {
    if (!collaboration || !replyText.trim()) return;


    setIsSubmitting(true);

    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();
    const senderId = authData.user?.id;
    if (!senderId) {
      toast.error("Non authentifié");
      setIsSubmitting(false);
      return;
    }


    const { data, error } = await supabase
      .from("collaboration_messages")
      .insert([{
        collaboration_id: collaboration.id,
        sender_id: senderId,
        sender_role: "client",
        message_type: "general",
        content: replyText.trim(),
        attachments: attachments, // JSONB column
      }])
      .select()
      .single();


    if (error?.code === "42501") {
      toast.error("Accès refusé");
    } else if (error) {
      toast.error(error.message);
    } else {
      setReplyText("");
      if (data) {
        setMessages((prev) => [...prev, data as CollaborationMessage]);
      }
      toast.success("Message envoyé");
      setAttachments([]);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!collaboration || !professional) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
        <FileText className="w-12 h-12 text-on-surface-variant/40 mb-4" />
        <h1 className="text-2xl font-bold text-on-surface mb-2">Proposition introuvable</h1>
        <Link href={`/projets/${projectIdStr}/pros`} className="text-primary font-semibold hover:underline">
          ← Retour aux professionnels
        </Link>
      </div>
    );
  }


  const statusBadge = STATUS_BADGE_CONFIG[collaboration.status];
  const initials = professional.business_name
    ? professional.business_name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-4xl w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-6">
          <Link href="/projets" className="hover:text-primary transition-colors">
            Mes projets
          </Link>
          <span className="opacity-30">/</span>
          <Link href={`/projets/${projectIdStr}/pros`} className="hover:text-primary transition-colors">
            Professionnels
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-primary truncate">Proposition de {professional.business_name}</span>
        </nav>

        {/* Back button */}
        <Link
          href={`/projets/${projectIdStr}/pros`}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux professionnels
        </Link>

        {/* Pro Header */}
        <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar size="lg" className="shrink-0">
              {professional.profile_picture_url ? (
                <AvatarImage src={professional.profile_picture_url} alt={professional.business_name} />
              ) : null}
              <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-on-surface">
                  Proposition de {professional.business_name}
                </h1>
                {statusBadge && (
                  <Badge className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-on-surface-variant">
                <span className="capitalize">{professional.category}</span>
                {professional.city && (
                  <>
                    <span>â€¢</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {professional.city}
                    </span>
                  </>
                )}
                {professional.avg_rating && (
                  <>
                    <span>â€¢</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {professional.avg_rating.toFixed(1)} ({professional.review_count || 0})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Proposition
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {collaboration.proposal_budget && (
              <div className="bg-surface-container rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-1">
                  <DollarSign className="w-4 h-4" />
                  Budget proposé
                </div>
                <div className="text-xl font-bold text-on-surface">
                  {collaboration.proposal_budget.toLocaleString("fr-FR")} {collaboration.proposal_currency || "XOF"}
                </div>
              </div>
            )}

            {collaboration.proposal_timeline && (
              <div className="bg-surface-container rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-1">
                  <Calendar className="w-4 h-4" />
                  Durée estimée
                </div>
                <div className="text-xl font-bold text-on-surface">
                  {collaboration.proposal_timeline}
                </div>
              </div>
            )}
          </div>

          {collaboration.proposal_text && (
            <div>
              <h3 className="text-sm font-semibold text-on-surface-variant mb-2">Description</h3>
              <div className="bg-surface-container rounded-xl p-4 text-sm text-on-surface whitespace-pre-wrap">
                {collaboration.proposal_text}
              </div>
            </div>
          )}

          {collaboration.proposal_submitted_at && (
            <div className="mt-4 text-xs text-on-surface-variant">
              Soumise le {new Date(collaboration.proposal_submitted_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Fil de discussion
          </h2>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-sm text-on-surface-variant">
                Aucun message pour le moment
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === "client" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${
                      msg.sender_role === "client"
                        ? "bg-primary/10 text-on-surface"
                        : "bg-surface-container text-on-surface"
                    }`}
                  >
                    <div className="text-xs text-on-surface-variant mb-1">
                      {msg.sender_role === "client" ? "Vous" : professional.business_name}
                      {msg.message_type !== "general" && (
                        <Badge className="ml-2 bg-surface-container-high text-on-surface-variant text-[10px]">
                          {msg.message_type === "proposal" && "Proposition"}
                          {msg.message_type === "revision_request" && "Demande de révision"}
                          {msg.message_type === "counter_offer" && "Contre-offre"}
                          {msg.message_type === "acceptance" && "Acceptation"}
                          {msg.message_type === "decline" && "Refus"}
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
                                <div className="relative w-8 h-8">
                                  <Image 
                                    src={att.url} 
                                    alt={att.name} 
                                    fill
                                    sizes="32px"
                                    className="object-cover rounded" 
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
                      {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Input */}
          {collaboration.status !== "active" && (
            <div className="space-y-4">
              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative group">
                      <div className="bg-surface-container-high rounded-lg p-2 flex items-center gap-2 pr-8 animate-in fade-in slide-in-from-bottom-2">
                        {att.type.startsWith('image/') ? (
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <Image 
                              src={att.url} 
                              alt={att.name} 
                              fill
                              sizes="40px"
                              className="object-cover rounded" 
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
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Votre message..."
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary/50 pr-12 min-h-[100px]"
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
                  onClick={handleSendReply}
                  disabled={(!replyText.trim() && attachments.length === 0) || isSubmitting || isUploading}
                  className="self-end px-4 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed h-[100px] inline-flex items-center justify-center min-w-[56px]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {collaboration.status !== "active" && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              Accepter â€” Sélectionner ce pro
            </button>
            <button
              onClick={handleRequestRevision}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              Demander un changement
            </button>
            <button
              onClick={handleDecline}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Refuser
            </button>
          </div>
        )}

        {collaboration.status === "active" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-green-700">Collaboration active</h3>
            <p className="text-sm text-green-600 mt-1">
              Ce professionnel a accès complet au projet.
            </p>
            <Link
              href={`/projets/${projectIdStr}`}
              className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              Voir le projet
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
