"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { LogoUploader } from "./LogoUploader";
import { StyleQuiz } from "./StyleQuiz";
import { PortfolioPreviewFrame } from "./PortfolioPreviewFrame";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";

interface Props {
  slug: string;
  initialLogoUrl: string | null;
  initialBrandPrimary: string | null;
  initialBrandSecondary: string | null;
  initialBrandAccent: string | null;
  initialStyleTokens: Partial<StyleAnswers>;
}

interface Swatch {
  color: string;
  label: string;
}

function BrandPaletteDisplay({ swatches }: { swatches: Swatch[] }) {
  if (swatches.length === 0) return null;
  return (
    <div className="space-y-2 pt-4 border-t border-outline-variant/15">
      <p className="text-xs font-medium text-on-surface-variant/60">Palette enregistrée</p>
      <div className="flex gap-3">
        {swatches.map(({ color, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div
              className="w-10 h-10 rounded-xl border border-outline-variant/20 shadow-sm"
              style={{ background: color }}
            />
            <span className="text-[9px] font-mono text-on-surface-variant/50">{color}</span>
            <span className="text-[9px] text-on-surface-variant/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdentiteEditor({
  slug,
  initialLogoUrl,
  initialBrandPrimary,
  initialBrandSecondary,
  initialBrandAccent,
  initialStyleTokens,
}: Props) {
  const [brandPrimary, setBrandPrimary] = useState(initialBrandPrimary);
  const [brandSecondary, setBrandSecondary] = useState(initialBrandSecondary);
  const [brandAccent, setBrandAccent] = useState(initialBrandAccent);
  const [styleOverride, setStyleOverride] = useState<Partial<StyleAnswers>>(initialStyleTokens);

  const swatches: Swatch[] = [
    { color: brandPrimary!, label: "Principale" },
    { color: brandSecondary!, label: "Secondaire" },
    { color: brandAccent!, label: "Accent" },
  ].filter((s) => !!s.color);

  function handleColorsSaved(primary: string, secondary: string, accent: string) {
    setBrandPrimary(primary);
    setBrandSecondary(secondary);
    setBrandAccent(accent);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
      {/* Left — Logo + quiz */}
      <div className="space-y-8">
        {/* Logo & palette */}
        <section className="rounded-2xl border border-outline-variant/20 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-kelen-green-600" />
            <h2 className="font-headline text-lg font-bold text-on-surface">Logo & palette</h2>
          </div>
          <LogoUploader
            initialLogoUrl={initialLogoUrl}
            initialBrandPrimary={initialBrandPrimary}
            onColorsSaved={(primary, secondary, accent) =>
              handleColorsSaved(primary, secondary, accent)
            }
          />
          <BrandPaletteDisplay swatches={swatches} />
        </section>

        {/* All style parameters */}
        <section className="rounded-2xl border border-outline-variant/20 bg-white p-6">
          <StyleQuiz
            initialAnswers={initialStyleTokens}
            onAnswersChange={setStyleOverride}
            hasBrandColor={!!brandPrimary}
            brandPrimary={brandPrimary}
          />
        </section>
      </div>

      {/* Right — Live preview */}
      <div className="xl:sticky xl:top-8 xl:self-start space-y-3">
        <h3 className="font-headline text-lg font-bold text-on-surface">Aperçu en direct</h3>
        <PortfolioPreviewFrame slug={slug} styleOverride={styleOverride} />
      </div>
    </div>
  );
}
