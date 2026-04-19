// components/portfolio/CopyEditor.tsx
"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveCopyManually } from "@/lib/actions/portfolio-site";

interface Props {
  initialHeroSubtitle?: string;
  initialAboutText?: string;
}

export function CopyEditor({ initialHeroSubtitle = "", initialAboutText = "" }: Props) {
  const [heroSubtitle, setHeroSubtitle] = useState(initialHeroSubtitle);
  const [aboutText, setAboutText] = useState(initialAboutText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = heroSubtitle !== initialHeroSubtitle || aboutText !== initialAboutText;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveCopyManually({ heroSubtitle, aboutText });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError("Erreur lors de la sauvegarde. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface">Textes du site</h3>
        <p className="text-sm text-on-surface-variant/70 mt-1">
          Modifiez manuellement les textes générés par l&apos;IA.
        </p>
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
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500"
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
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || (!isDirty && !saved)}
        className="h-10 px-5 rounded-xl bg-kelen-green-600 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kelen-green-700 transition-colors"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? "Sauvegarde..." : saved ? <><Save className="w-4 h-4" /> Sauvegardé ✓</> : <><Save className="w-4 h-4" /> Sauvegarder</>}
      </button>
    </div>
  );
}
