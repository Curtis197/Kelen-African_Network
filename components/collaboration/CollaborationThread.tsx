"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fil de discussion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun message pour le moment
            </p>
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
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!isOwn && (
                        <span className="text-xs text-gray-500">
                          {message.sender_role === 'client' ? 'Client' : 'Professional'}
                        </span>
                      )}
                      <Badge variant="outline" className={`text-xs ${config.color}`}>
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(message.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>

                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t pt-4">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ã‰crivez votre message..."
            className="mb-2"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="w-full"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Envoyer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
