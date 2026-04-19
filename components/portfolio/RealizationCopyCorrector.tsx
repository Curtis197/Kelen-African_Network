// components/portfolio/RealizationCopyCorrector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check, X, RotateCcw } from "lucide-react";
import { correctRealizationText, saveRealizationCopy } from "@/lib/actions/realization-copy";

interface Props {
  id: string;
  title: string;
  description: string;
}

type Phase = "idle" | "correcting" | "preview" | "done";

export function RealizationCopyCorrector({ id, title, description }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [corrected, setCorrected] = useState<{ title: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCorrect() {
    setPhase("correcting");
    setError(null);
    try {
      const { corrected: result } = await correctRealizationText({ title, description });
      setCorrected(result);
      setPhase("preview");
    } catch {
      setError("Erreur lors de la correction. Réessayez.");
      setPhase("idle");
    }
  }

  async function handleApply() {
    if (!corrected) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveRealizationCopy(id, corrected);
      setPhase("done");
      router.refresh();
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    setCorrected(null);
    setPhase("idle");
    setError(null);
  }

  if (phase === "done") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-kelen-green-50 border border-kelen-green-200 text-kelen-green-700 text-sm font-semibold">
        <Check className="w-4 h-4" />
        Textes mis à jour
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleCorrect}
          disabled={phase === "correcting" || isSaving}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
        >
          {phase === "correcting"
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Sparkles className="w-4 h-4" />
          }
          {phase === "correcting" ? "Correction en cours..." : "Améliorer avec l'IA"}
        </button>

        {phase === "preview" && (
          <button
            onClick={handleDiscard}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Annuler
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {phase === "preview" && corrected && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 space-y-4">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Suggestion IA</p>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-on-surface-variant/60">Titre</p>
            <p className="text-sm font-bold text-on-surface">{corrected.title}</p>
          </div>

          {corrected.description && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-on-surface-variant/60">Description</p>
              <p className="text-sm text-on-surface/80 leading-relaxed whitespace-pre-wrap">
                {corrected.description}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApply}
              disabled={isSaving}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-violet-700 transition-colors"
            >
              {isSaving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />
              }
              {isSaving ? "Sauvegarde..." : "Appliquer"}
            </button>
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Ignorer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
