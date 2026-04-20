"use client";

import { Mail, CheckCircle2, XCircle, Clock, Send } from "lucide-react";
import type { NewsletterCampaign, CampaignStatus } from "@/lib/types/newsletter";

interface Props {
  campaigns: NewsletterCampaign[];
}

const statusConfig: Record<CampaignStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  sent: {
    label: "Envoyée",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    classes: "bg-kelen-green-50 text-kelen-green-700",
  },
  queued: {
    label: "Planifiée",
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: "bg-amber-50 text-amber-700",
  },
  sending: {
    label: "En cours",
    icon: <Send className="w-3.5 h-3.5" />,
    classes: "bg-blue-50 text-blue-700",
  },
  failed: {
    label: "Échouée",
    icon: <XCircle className="w-3.5 h-3.5" />,
    classes: "bg-red-50 text-red-700",
  },
  draft: {
    label: "Brouillon",
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: "bg-surface-container text-on-surface-variant",
  },
};

export function CampaignHistory({ campaigns }: Props) {
  const sent = campaigns.filter((c) => c.status !== "draft");

  if (sent.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucune campagne envoyée pour l&apos;instant.</p>
        <p className="text-sm mt-1 opacity-70">
          Composez votre première newsletter depuis l&apos;onglet &quot;Composer&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sent.map((campaign) => {
        const cfg = statusConfig[campaign.status];
        return (
          <div
            key={campaign.id}
            className="rounded-xl border border-border bg-surface-container-low p-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-on-surface truncate">{campaign.subject}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-on-surface-variant">
                  {campaign.sent_at
                    ? new Date(campaign.sent_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {campaign.recipient_count} destinataire{campaign.recipient_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.classes}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
