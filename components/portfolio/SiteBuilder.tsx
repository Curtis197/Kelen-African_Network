// components/portfolio/SiteBuilder.tsx
"use client";

import { useState, useTransition } from "react";
import { StyleQuiz } from "./StyleQuiz";
import { CopywritingQuiz } from "./CopywritingQuiz";
import { CopyEditor } from "./CopyEditor";
import { AboutEditor } from "./AboutEditor";
import { PortfolioPreviewFrame } from "./PortfolioPreviewFrame";
import { DomainSearch } from "./DomainSearch";
import { DomainManager } from "./DomainManager";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import type { CopyAnswers } from "@/lib/portfolio/copy-questions";
import { Palette, FileText, Globe, Lock, Eye, UserRound } from "lucide-react";
import Link from "next/link";
import { updatePortfolioVisibility } from "@/lib/actions/portfolio";
import { toast } from "sonner";

interface Props {
  pro: { id: string; slug: string; businessName: string };
  portfolio: {
    style_tokens?: Partial<StyleAnswers>;
    copy_quiz_answers?: Partial<CopyAnswers>;
    hero_subtitle?: string;
    about_text?: string;
    about_image_url?: string;
    custom_domain?: string;
    domain_status?: string;
    show_realizations_section?: boolean;
    show_services_section?: boolean;
    show_products_section?: boolean;
    show_about_section?: boolean;
  } | null;
  isPaid: boolean;
}

const TABS = [
  { id: "style",      label: "Style",      icon: Palette   },
  { id: "content",    label: "Contenu",    icon: FileText  },
  { id: "about",      label: "À propos",   icon: UserRound },
  { id: "domain",     label: "Domaine",    icon: Globe     },
  { id: "visibility", label: "Visibilité", icon: Eye       },
] as const;

type TabId = (typeof TABS)[number]["id"];

function VisibilityToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        {description && (
          <p className="text-xs text-on-surface-variant/60">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-kelen-green-600 focus-visible:ring-offset-2 ${
          checked ? "bg-kelen-green-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function SiteBuilder({ pro, portfolio, isPaid }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("style");
  const [styleOverride, setStyleOverride] = useState<Partial<StyleAnswers>>(
    portfolio?.style_tokens ?? {}
  );

  // Visibility state
  const [showRealizations, setShowRealizations] = useState(
    portfolio?.show_realizations_section ?? true
  );
  const [showServices, setShowServices] = useState(
    portfolio?.show_services_section ?? true
  );
  const [showProducts, setShowProducts] = useState(
    portfolio?.show_products_section ?? true
  );
  const [showAbout, setShowAbout] = useState(
    portfolio?.show_about_section ?? true
  );
  const [isPending, startTransition] = useTransition();

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

        {activeTab === "about" && (
          <AboutEditor
            initialAboutText={portfolio?.about_text ?? ""}
            initialAboutImageUrl={portfolio?.about_image_url ?? ""}
          />
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

        {activeTab === "visibility" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Visibilité des sections</h3>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                Choisissez quelles sections afficher sur votre site portfolio.
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low divide-y divide-outline-variant/20 px-5">
              <VisibilityToggle
                label="Réalisations"
                description="Vos projets et travaux réalisés"
                checked={showRealizations}
                onChange={setShowRealizations}
              />
              <VisibilityToggle
                label="Services"
                description="Vos prestations et offres de services"
                checked={showServices}
                onChange={setShowServices}
              />
              <VisibilityToggle
                label="Produits"
                description="Vos produits à vendre"
                checked={showProducts}
                onChange={setShowProducts}
              />
              <VisibilityToggle
                label="À propos"
                description="Votre présentation et biographie"
                checked={showAbout}
                onChange={setShowAbout}
              />
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await updatePortfolioVisibility({
                      show_realizations_section: showRealizations,
                      show_services_section: showServices,
                      show_products_section: showProducts,
                      show_about_section: showAbout,
                    });
                    toast.success("Visibilité mise à jour avec succès");
                  } catch {
                    toast.error("Erreur lors de la sauvegarde. Veuillez réessayer.");
                  }
                });
              }}
              className="h-11 px-6 rounded-xl bg-kelen-green-600 text-white text-sm font-bold hover:bg-kelen-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sauvegarde…
                </>
              ) : (
                "Sauvegarder"
              )}
            </button>
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
