// components/portfolio/PortfolioPreviewFrame.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";

interface Props {
  slug: string;
  styleOverride?: Partial<StyleAnswers>;
}

export function PortfolioPreviewFrame({ slug, styleOverride }: Props) {
  console.log('[COMPONENT] PortfolioPreviewFrame render:', { slug, styleOverride });
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [key, setKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setKey(k => k + 1), 800);
    return () => clearTimeout(t);
  }, [JSON.stringify(styleOverride)]);

  const styleParam = styleOverride
    ? encodeURIComponent(JSON.stringify(styleOverride))
    : "";

  const previewUrl = `/api/portfolio-preview?slug=${slug}${styleParam ? `&style=${styleParam}` : ""}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewport("desktop")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            viewport === "desktop"
              ? "bg-kelen-green-600 text-white"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Bureau
        </button>
        <button
          onClick={() => setViewport("mobile")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            viewport === "mobile"
              ? "bg-kelen-green-600 text-white"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Mobile
        </button>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant/40 ml-2" />}
      </div>

      <div
        className="relative bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 transition-all duration-300"
        style={{
          height: "520px",
          maxWidth: viewport === "mobile" ? "375px" : "100%",
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low z-10">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-kelen-green-600 mx-auto" />
              <p className="text-xs text-on-surface-variant/60 font-medium">Chargement de l'aperçu...</p>
            </div>
          </div>
        )}
        <iframe
          key={key}
          src={previewUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          title="Aperçu du site"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
