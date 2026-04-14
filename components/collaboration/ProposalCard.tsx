"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectProfessionalWithProfile, ProjectCollaboration } from "@/lib/types/collaborations";
import {
  Check,
  Clock,
  MessageSquare,
  Star,
  User,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface ProposalCardProps {
  pro: ProjectProfessionalWithProfile;
  collaboration?: ProjectCollaboration;
  onViewProposal?: (proId: string) => void;
  onRequestChange?: (proId: string) => void;
  onPick?: (proId: string) => void;
  onSendReminder?: (proId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; badgeColor: string; icon: React.ReactNode }> = {
  pending: {
    label: "En attente",
    badgeColor: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-3 h-3" />,
  },
  negotiating: {
    label: "En négociation",
    badgeColor: "bg-purple-100 text-purple-700",
    icon: <MessageSquare className="w-3 h-3" />,
  },
  active: {
    label: "Actif",
    badgeColor: "bg-green-100 text-green-700",
    icon: <Check className="w-3 h-3" />,
  },
};

export function ProposalCard({
  pro,
  collaboration,
  onViewProposal,
  onRequestChange,
  onPick,
  onSendReminder,
}: ProposalCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  console.log('[ProposalCard] Render:', { 
    proId: pro.professional_id, 
    businessName: pro.professional?.business_name,
    collabStatus: collaboration?.status 
  });

  const collabStatus = collaboration?.status || 'pending';
  const config = STATUS_CONFIG[collabStatus] || STATUS_CONFIG.pending;
  const hasProposal = !!collaboration?.proposal_submitted_at;

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    console.log('[ProposalCard] Action triggered');
    try {
      action();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={pro.professional?.profile_picture_url || undefined} />
            <AvatarFallback>
              <User className="w-6 h-6 text-gray-500" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {pro.professional?.business_name || "Professional"}
                </h3>
                <p className="text-sm text-gray-500">
                  {pro.professional?.category} • {pro.professional?.city}, {pro.professional?.country}
                </p>
                {pro.professional?.avg_rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {pro.professional.avg_rating.toFixed(1)} ({pro.professional.review_count} avis)
                    </span>
                  </div>
                )}
              </div>

              <Badge className={config.badgeColor}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
            </div>

            {hasProposal && collaboration && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Proposal</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {collaboration.proposal_budget?.toLocaleString()} {collaboration.proposal_currency || 'XOF'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-500">Timeline</span>
                  <span className="text-sm text-gray-700">{collaboration.proposal_timeline || "N/A"}</span>
                </div>
                {collaboration.proposal_text && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {collaboration.proposal_text}
                  </p>
                )}
              </div>
            )}

            {!hasProposal && collabStatus === 'pending' && (
              <p className="text-sm text-yellow-600 mt-2">
                ⏳ En attente de réponse du professionnel
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              {hasProposal && onViewProposal && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(() => onViewProposal(pro.professional_id))}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Voir la proposition"}
                </Button>
              )}

              {hasProposal && collabStatus === 'negotiating' && onRequestChange && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(() => onRequestChange(pro.professional_id))}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Demander un changement"}
                </Button>
              )}

              {!hasProposal && collabStatus === 'pending' && onSendReminder && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(() => onSendReminder(pro.professional_id))}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Envoyer un rappel"}
                </Button>
              )}

              {hasProposal && collabStatus === 'negotiating' && onPick && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleAction(() => onPick(pro.professional_id))}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Sélectionner
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
