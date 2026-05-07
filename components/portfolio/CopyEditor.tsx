// components/portfolio/CopyEditor.tsx
"use client";

import { useState } from "react";
import { Loader2, Save, Sparkles, RotateCcw } from "lucide-react";
import { saveCopyManually, correctCopyWithAI } from "@/lib/actions/portfolio-site";

interface Props {
  initialHeroSubtitle?: string;
  initialAboutText?: string;
}

export function CopyEditor({ initialHeroSubtitle = "", initialAboutText = — }: Props) {
  const [heroSubtitle, setHeroSubtitle] = useState(initialHeroSubtitle);
  const [aboutText, setAboutText] = useState(initialAboutText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<{ heroSubtitle: string; aboutText: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    heroSubtitle !== initialHeroSubtitle ||
    aboutText !== initialAboutText;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveCopyManually({ heroSubtitle, aboutText });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erreur lors de la sauvegarde. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCorrect() {
    if (!heroSubtitle && !aboutText) return;
    setCorrecting(true);
    setError(null);
    try {
      const { corrected } = await correctCopyWithAI({ heroSubtitle, aboutText });
      setLastCorrection({ heroSubtitle, aboutText });
      setHeroSubtitle(corrected.heroSubtitle);
      setAboutText(corrected.aboutText);
      setSaved(false);
    } catch {
      setError("Erreur lors de la correction IA. Réessayez.");
    } finally {
      setCorrecting(false);
    }
  }

  function handleUndo() {
    if (!lastCorrection) return;
    setHeroSubtitle(lastCorrection.heroSubtitle);
    setAboutText(lastCorrection.aboutText);
    setLastCorrection(null);
    setSaved(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface">Textes du site</h3>
          <p className="text-sm text-on-surface-variant/70 mt-1">
            Modifiez ou laissez l&apos;IA améliorer vos textes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lastCorrection && (
            <button
              onClick={handleUndo}
              className="h-9 px-3 rounded-lg border border-outline-variant/30 text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 hover:bg-surface-container transition-colors"
              title="Annuler la correction"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Annuler
            </button>
          )}
          <button
            onClick={handleCorrect}
            disabled={correcting || (!heroSubtitle && !aboutText)}
            className="h-9 px-4 rounded-lg bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
          >
            {correcting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />
            }
            {correcting ? "Correction..." : "Améliorer avec l'IA"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold text-sm text-on-surface">
          Phrase d&apos;accroche{" "}
          <span className="text-on-surface-variant/40 font-normal">(max 12 mots)</span>
        </label>
        <input
          type="text"
          value={heroSubtitle}
          onChange={e => { setHeroSubtitle(e.target.value); setSaved(false); }}
          placeholder="Ex: L'excellence du bâtiment à votre service depuis 20 ans."
          maxLength={120}
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold text-sm text-on-surface">
          Texte de présentation{" "}
          <span className="text-on-surface-variant/40 font-normal">(3-4 phrases)</span>
        </label>
        <textarea
          value={aboutText}
          onChange={e => { setAboutText(e.target.value); setSaved(false); }}
          placeholder="Ex: Je m'appelle Mamadou Diallo et je construis des bâtiments solides depuis plus de vingt ans à Abidjan..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500 resize-none transition-colors"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || (!isDirty && !saved)}
        className="h-10 px-5 rounded-xl bg-kelen-green-600 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kelen-green-700 transition-colors"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Sauvegarde..." : saved
          ? <><Save className="w-4 h-4" /> Sauvegardé ✓</>
          : <><Save className="w-4 h-4" /> Sauvegarder</>
        }
      </button>
    </div>
  );
}
