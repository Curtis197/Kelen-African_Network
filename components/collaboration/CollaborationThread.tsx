"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { CollaborationMessage, SenderRole, MessageType } from "@/lib/types/collaborations";
import { sendCollaborationMessage } from "@/lib/actions/collaborations";
import {
  User,
  Send,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CollaborationThreadProps {
  collaborationId: string;
  messages: CollaborationMessage[];
  currentUserId: string;
  currentUserRole: SenderRole;
  onMessageSent?: () => void;
}

const MESSAGE_TYPE_CONFIG: Record<MessageType, { label: string; icon: React.ReactNode; color: string }> = {
  proposal: {
    label: "Proposition",
    icon: <FileText className="w-3.5 h-3.5" />,
    color: "bg-blue-100 text-blue-700",
  },
  counter_offer: {
    label: "Contre-offre",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    color: "bg-purple-100 text-purple-700",
  },
  revision_request: {
    label: "Demande de rÃ©vision",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    color: "bg-amber-100 text-amber-700",
  },
  acceptance: {
    label: "Acceptation",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: "bg-green-100 text-green-700",
  },
  decline: {
    label: "Refus",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "bg-red-100 text-red-700",
  },
  general: {
    label: "Message",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    color: "bg-gray-100 text-gray-700",
  },
};

export function CollaborationThread({
  collaborationId,
  messages,
  currentUserId,
  currentUserRole,
  onMessageSent,
}: CollaborationThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);


  const handleSend = async () => {

    if (!newMessage.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const { success, error } = await sendCollaborationMessage(collaborationId, {
        type: 'general',
        content: newMessage,
      }, currentUserRole);


      if (success) {
        setNewMessage("");
        onMessageSent?.();
      } else {
      }
    } catch (err) {
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-on-surface">Fil de discussion</h3>
          <p className="text-xs text-on-surface-variant">
            {messages.length > 0 ? `${messages.length} message${messages.length > 1 ? 's' : ''}` : 'Aucun message'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 p-5 max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface-container flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-on-surface-variant/40" />
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Aucun message pour le moment</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">Commencez la conversation ci-dessous.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const config = MESSAGE_TYPE_CONFIG[message.message_type];

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {!isOwn && (
                      <span className="text-xs font-medium text-on-surface-variant">
                        {message.sender_role === 'client' ? 'Client' : 'Professionnel'}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] gap-1 py-0 h-5 ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-on-surface-variant/50">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? 'bg-primary text-on-primary rounded-tr-sm'
                        : 'bg-surface-container text-on-surface rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose */}
      <div className="border-t border-border p-4 bg-surface-container-low/40">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="mb-3 resize-none bg-white border-border focus:ring-primary/20 text-sm"
          rows={3}
          disabled={isSending}
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="w-full rounded-xl font-semibold"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Envoyer le message
        </Button>
      </div>
    </div>
  );
}
