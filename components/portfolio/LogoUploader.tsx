"use client";

import { useState, useRef, useTransition } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { uploadLogo, saveBrandColors } from "@/lib/actions/branding";
import { toast } from "sonner";

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface Props {
  initialLogoUrl: string | null;
  initialBrandPrimary: string | null;
  onColorsSaved?: (primary: string) => void;
}

export function LogoUploader({ initialLogoUrl, initialBrandPrimary, onColorsSaved }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialLogoUrl);
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<ExtractedColors | null>(
    initialBrandPrimary
      ? { primary: initialBrandPrimary, secondary: initialBrandPrimary, accent: initialBrandPrimary }
      : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function extractColors(src: string): Promise<ExtractedColors> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Dynamic import avoids SSR issues
          const { default: ColorThief } = await import("colorthief");
          const thief = new ColorThief();
          const palette = thief.getPalette(img, 3) as [number, number, number][];
          resolve({
            primary:   rgbToHex(...palette[0]),
            secondary: rgbToHex(...palette[1]),
            accent:    rgbToHex(...palette[2]),
          });
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function handleFile(f: File) {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setColors(null);
    extractColors(url)
      .then(setColors)
      .catch(() => toast.error("Impossible d'extraire les couleurs automatiquement."));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleSave() {
    if (!file || !colors) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("logo", file);
      const { storagePath, error: uploadError } = await uploadLogo(formData);
      if (uploadError || !storagePath) {
        toast.error(uploadError ?? "Erreur lors du téléversement");
        return;
      }
      const { error: colorError } = await saveBrandColors(storagePath, colors);
      if (colorError) {
        toast.error(colorError);
        return;
      }
      toast.success("Logo et couleurs enregistrés");
      setFile(null);
      onColorsSaved?.(colors.primary);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-sm text-on-surface">Logo & couleurs de marque</p>
        <p className="text-xs text-on-surface-variant/60 mt-0.5">
          Téléversez votre logo — les couleurs sont extraites automatiquement.
        </p>
      </div>

      <div className="flex items-start gap-5">
        {/* Drop zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-20 h-20 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1 shrink-0 overflow-hidden ${
            isDragging
              ? "border-kelen-green-500 bg-kelen-green-50"
              : "border-outline-variant/40 hover:border-kelen-green-400 hover:bg-surface-container-low"
          }`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-on-surface-variant/40" />
              <span className="text-[10px] text-on-surface-variant/40 font-medium text-center leading-tight px-1">
                PNG, SVG, JPEG
              </span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {/* Extracted colors */}
        <div className="flex-1 space-y-2 pt-0.5">
          {colors ? (
            <>
              <p className="text-xs font-medium text-on-surface-variant/60">Couleurs extraites</p>
              <div className="flex gap-2.5">
                {[
                  { key: "primary",   label: "Principale" },
                  { key: "secondary", label: "Secondaire" },
                  { key: "accent",    label: "Accent"     },
                ].map(({ key, label }) => {
                  const hex = colors[key as keyof ExtractedColors];
                  return (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <div
                        className="w-9 h-9 rounded-xl border border-outline-variant/20 shadow-sm"
                        style={{ background: hex }}
                      />
                      <span className="text-[9px] font-mono text-on-surface-variant/50 leading-none">
                        {hex}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/40 leading-none">{label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-on-surface-variant/40 italic pt-2">
              {previewUrl
                ? "Extraction en cours…"
                : "Les couleurs de votre logo apparaîtront ici."}
            </p>
          )}
        </div>
      </div>

      {/* Save button — only when a new file is staged */}
      {file && colors && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 h-9 px-5 rounded-xl bg-kelen-green-600 text-white text-sm font-bold hover:bg-kelen-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Enregistrement…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Enregistrer le logo
            </>
          )}
        </button>
      )}
    </div>
  );
}
