// components/portfolio/SiteBuilder.tsx
"use client";

import { useState } from "react";
import { StyleQuiz } from "./StyleQuiz";
import { CopywritingQuiz } from "./CopywritingQuiz";
import { CopyEditor } from "./CopyEditor";
import { PortfolioPreviewFrame } from "./PortfolioPreviewFrame";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import type { CopyAnswers } from "@/lib/portfolio/copy-questions";
import { Lock } from "lucide-react";
import Link from "next/link";
import { DomainSearch } from "./DomainSearch";
import { DomainManager } from "./DomainManager";

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

export function SiteBuilder({ pro, portfolio, isPaid }: Props) {
  console.log('[COMPONENT] SiteBuilder render:', { proSlug: pro.slug, isPaid, hasPortfolio: !!portfolio });
  const [styleOverride, setStyleOverride] = useState<Partial<StyleAnswers>>(
    portfolio?.style_tokens ?? {}
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
      {/* Left: Quizzes */}
      <div className="space-y-12">
        <StyleQuiz
          initialAnswers={portfolio?.style_tokens ?? {}}
          onAnswersChange={setStyleOverride}
        />

        <div className="border-t border-outline-variant/20" />

        <CopywritingQuiz
          initialAnswers={portfolio?.copy_quiz_answers ?? {}}
          onCopyGenerated={() => {
            /* preview auto-reloads via key change in PortfolioPreviewFrame */
          }}
        />

        <div className="border-t border-outline-variant/20" />

        <CopyEditor
          initialHeroSubtitle={portfolio?.hero_subtitle ?? ""}
          initialAboutText={portfolio?.about_text ?? ""}
        />
      </div>

      {/* Right: Preview + Domain */}
      <div className="space-y-8">
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface mb-3">Aperçu en direct</h3>
          <PortfolioPreviewFrame slug={pro.slug} styleOverride={styleOverride} />
        </div>

        {/* Domain section */}
        <div className="rounded-2xl border border-outline-variant/20 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Votre domaine</h3>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                Publiez sur votre propre adresse web.
              </p>
            </div>
            {!isPaid && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
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
            <Link
              href="/pro/abonnement"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
            >
              Passer Gold ou Silver
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
