// components/portfolio/SiteBuilder.tsx
"use client";

import { useState } from "react";
import { StyleQuiz } from "./StyleQuiz";
import { CopywritingQuiz } from "./CopywritingQuiz";
import { CopyEditor } from "./CopyEditor";
import { PortfolioPreviewFrame } from "./PortfolioPreviewFrame";
import { DomainSearch } from "./DomainSearch";
import { DomainManager } from "./DomainManager";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import type { CopyAnswers } from "@/lib/portfolio/copy-questions";
import { Palette, FileText, Globe, Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  pro: { id: string; slug: string; businessName: string };
  portfolio: {
    style_tokens?: Partial<StyleAnswers>;
    copy_quiz_answers?: Partial<CopyAnswers>;
    hero_subtitle?: string;
    about_text?: string;
    custom_domain?: string;
    domain_status?: string;
  } | null;
  isPaid: boolean;
}

const TABS = [
  { id: "style",   label: "Style",   icon: Palette  },
  { id: "content", label: "Contenu", icon: FileText  },
  { id: "domain",  label: "Domaine", icon: Globe     },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SiteBuilder({ pro, portfolio, isPaid }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("style");
  const [styleOverride, setStyleOverride] = useState<Partial<StyleAnswers>>(
    portfolio?.style_tokens ?? {}
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
      {/* Left: Tab bar + content */}
      <div className="space-y-8">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-2xl bg-surface-container-low border border-outline-variant/20">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === id
                  ? "bg-white shadow-sm text-on-surface"
                  : "text-on-surface-variant/60 hover:text-on-surface hover:bg-white/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === "style" && (
          <StyleQuiz
            initialAnswers={portfolio?.style_tokens ?? {}}
            onAnswersChange={setStyleOverride}
          />
        )}

        {activeTab === "content" && (
          <div className="space-y-10">
            <CopywritingQuiz
              initialAnswers={portfolio?.copy_quiz_answers ?? {}}
              onCopyGenerated={() => { /* preview reloads via iframe key */ }}
            />
            <div className="border-t border-outline-variant/20" />
            <CopyEditor
              initialHeroSubtitle={portfolio?.hero_subtitle ?? ""}
              initialAboutText={portfolio?.about_text ?? ""}
            />
          </div>
        )}

        {activeTab === "domain" && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface">Votre domaine</h3>
                <p className="text-sm text-on-surface-variant/70 mt-1">
                  Publiez votre site sur votre propre adresse web.
                </p>
              </div>
              {!isPaid && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
                  <Lock className="w-3 h-3" />
                  Gold / Silver
                </span>
              )}
            </div>

            {portfolio?.custom_domain ? (
              <DomainManager
                domain={portfolio.custom_domain}
                status={portfolio.domain_status ?? "pending_dns"}
              />
            ) : isPaid ? (
              <DomainSearch />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-3">
                <p className="text-sm text-amber-800">
                  La gestion de domaine personnalisé est réservée aux membres <strong>Gold</strong> et <strong>Silver</strong>.
                </p>
                <Link
                  href="/pro/abonnement"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
                >
                  Passer Gold ou Silver
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Live preview (sticky on xl) */}
      <div className="xl:sticky xl:top-8 xl:self-start space-y-3">
        <h3 className="font-headline text-lg font-bold text-on-surface">Aperçu en direct</h3>
        <PortfolioPreviewFrame slug={pro.slug} styleOverride={styleOverride} />
      </div>
    </div>
  );
}
