"use client";

import { useState } from "react";
import { Users, PenSquare, History } from "lucide-react";
import { SubscriberTable } from "./SubscriberTable";
import { CampaignComposer } from "./CampaignComposer";
import { CampaignHistory } from "./CampaignHistory";
import type { NewsletterSubscriber, NewsletterCampaign } from "@/lib/types/newsletter";

type Tab = "abonnes" | "composer" | "historique";

interface Props {
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
  professionalId: string;
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "abonnes", label: "Abonnés", icon: <Users className="w-4 h-4" /> },
  { id: "composer", label: "Composer", icon: <PenSquare className="w-4 h-4" /> },
  { id: "historique", label: "Historique", icon: <History className="w-4 h-4" /> },
];

export function NewsletterDashboard({ subscribers, campaigns, professionalId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("abonnes");

  const lastSentCampaign = campaigns.find((c) => c.status === "sent");

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-low rounded-xl p-4 border border-border">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-1">Abonnés actifs</p>
          <p className="text-3xl font-extrabold text-on-surface">{subscribers.length}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 border border-border">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-1">Campagnes envoyées</p>
          <p className="text-3xl font-extrabold text-on-surface">
            {campaigns.filter((c) => c.status === "sent").length}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 border border-border hidden sm:block">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-1">Dernière campagne</p>
          <p className="text-sm font-semibold text-on-surface mt-1">
            {lastSentCampaign?.sent_at
              ? new Date(lastSentCampaign.sent_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-kelen-green-600 text-kelen-green-700"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "abonnes" && <SubscriberTable subscribers={subscribers} />}
        {activeTab === "composer" && (
          <CampaignComposer
            lastSentAt={lastSentCampaign?.sent_at ?? null}
            professionalId={professionalId}
          />
        )}
        {activeTab === "historique" && <CampaignHistory campaigns={campaigns} />}
      </div>
    </div>
  );
}
