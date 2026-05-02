"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveBrandTheme } from "@/lib/actions/portfolio-site";
import { toast } from "sonner";
import type { ColorMode } from "@/lib/pro-site/types";

const THEMES: {
  value: ColorMode;
  label: string;
  description: string;
  preview: { bg: string; surface: string; text: string; accent: string };
}[] = [
  {
    value: "light",
    label: "Clair & épuré",
    description: "Fond blanc, texte sombre",
    preview: { bg: "#ffffff", surface: "#f5f5f5", text: "#1a1a2e", accent: "#009639" },
  },
  {
    value: "dark",
    label: "Sombre & fort",
    description: "Fond noir, texte clair",
    preview: { bg: "#111111", surface: "#1a1a1a", text: "#f0f0f0", accent: "#4ade80" },
  },
  {
    value: "warm",
    label: "Chaud & naturel",
    description: "Tons terre & chaleur",
    preview: { bg: "#faf7f2", surface: "#f2ece2", text: "#2c1f0e", accent: "#92400e" },
  },
];

interface Props {
  initialMode: ColorMode;
  brandPrimary: string | null;
}

export function BrandThemePicker({ initialMode, brandPrimary }: Props) {
  const [selected, setSelected] = useState<ColorMode>(initialMode);
  const [isPending, startTransition] = useTransition();

  function handleSelect(mode: ColorMode) {
    if (mode === "logo-color" && !brandPrimary) return;
    setSelected(mode);
    startTransition(async () => {
      try {
        await saveBrandTheme(mode);
        toast.success("Ambiance enregistrée");
      } catch {
        toast.error("Erreur lors de la sauvegarde");
        setSelected(initialMode);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-sm text-on-surface">Ambiance générale</p>
        <p className="text-xs text-on-surface-variant/60 mt-0.5">
          Appliquée sur votre site web et vos documents imprimables.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((theme) => {
          const active = selected === theme.value;
          return (
            <button
              key={theme.value}
              onClick={() => handleSelect(theme.value)}
              disabled={isPending}
              className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-150 ${
                active
                  ? "border-kelen-green-600 shadow-md"
                  : "border-outline-variant/25 hover:border-kelen-green-300"
              }`}
            >
              {/* Mini page preview */}
              <div
                className="h-20 flex flex-col gap-1.5 p-3"
                style={{ background: theme.preview.bg }}
              >
                <div
                  className="h-2 w-14 rounded-full"
                  style={{ background: theme.preview.text, opacity: 0.8 }}
                />
                <div
                  className="h-1.5 w-10 rounded-full"
                  style={{ background: theme.preview.text, opacity: 0.3 }}
                />
                <div className="flex gap-1.5 mt-1">
                  <div
                    className="h-6 w-6 rounded-lg"
                    style={{ background: theme.preview.surface }}
                  />
                  <div
                    className="h-6 w-6 rounded-lg"
                    style={{ background: theme.preview.surface }}
                  />
                  <div
                    className="h-6 flex-1 rounded-lg"
                    style={{ background: theme.preview.accent, opacity: 0.85 }}
                  />
                </div>
              </div>

              {/* Label */}
              <div className="px-3 py-2" style={{ background: theme.preview.bg }}>
                <p
                  className="font-bold text-xs"
                  style={{ color: theme.preview.text }}
                >
                  {theme.label}
                </p>
                <p className="text-[10px] opacity-50 mt-0.5" style={{ color: theme.preview.text }}>
                  {theme.description}
                </p>
              </div>

              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-kelen-green-600 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
            </button>
          );
        })}

        {/* Logo-color option */}
        <button
          onClick={() => handleSelect("logo-color")}
          disabled={isPending || !brandPrimary}
          className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-150 ${
            selected === "logo-color"
              ? "border-kelen-green-600 shadow-md"
              : brandPrimary
              ? "border-outline-variant/25 hover:border-kelen-green-300"
              : "border-outline-variant/15 opacity-45 cursor-not-allowed"
          }`}
        >
          {/* Mini page preview using brand color */}
          <div
            className="h-20 flex flex-col gap-1.5 p-3"
            style={{
              background: brandPrimary ? `${brandPrimary}0a` : "#f5f5f5",
            }}
          >
            <div
              className="h-2 w-14 rounded-full"
              style={{ background: "#1a1a2e", opacity: 0.7 }}
            />
            <div
              className="h-1.5 w-10 rounded-full"
              style={{ background: "#1a1a2e", opacity: 0.25 }}
            />
            <div className="flex gap-1.5 mt-1">
              <div
                className="h-6 w-6 rounded-lg"
                style={{
                  background: brandPrimary ? `${brandPrimary}18` : "#eeeeee",
                }}
              />
              <div
                className="h-6 flex-1 rounded-lg"
                style={{ background: brandPrimary ?? "#cccccc", opacity: 0.85 }}
              />
            </div>
          </div>

          <div
            className="px-3 py-2"
            style={{ background: brandPrimary ? `${brandPrimary}0a` : "#f5f5f5" }}
          >
            <div className="flex items-center gap-1.5">
              {brandPrimary && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                  style={{ background: brandPrimary }}
                />
              )}
              <p className="font-bold text-xs text-on-surface">Couleur du logo</p>
            </div>
            <p className="text-[10px] text-on-surface-variant/50 mt-0.5">
              {brandPrimary ? "Teinte issue de votre marque" : "Téléversez votre logo d'abord"}
            </p>
          </div>

          {selected === "logo-color" && (
            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-kelen-green-600 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
