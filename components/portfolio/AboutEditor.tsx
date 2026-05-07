"use client";

import { useState } from "react";
import { Loader2, Save, Sparkles, RotateCcw, ImageIcon } from "lucide-react";
import { saveAboutText } from "@/lib/actions/portfolio-site";
import { toast } from "sonner";
import Image from "next/image";

interface Props {
  initialAboutText?: string;
  initialAboutImageUrl?: string;
}

export function AboutEditor({ initialAboutText = "", initialAboutImageUrl = "" }: Props) {
  const [aboutText, setAboutText] = useState(initialAboutText);
  const [aboutImageUrl, setAboutImageUrl] = useState(initialAboutImageUrl);
  const [saving, setSaving] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [lastText, setLastText] = useState<string | null>(null);

  const isDirty = aboutText !== initialAboutText || aboutImageUrl !== initialAboutImageUrl;

  async function handleSave() {
    setSaving(true);
    try {
      await saveAboutText({ aboutText, aboutImageUrl: aboutImageUrl || null });
      toast.success("Page À propos sauvegardée");
    } catch {
      toast.error("Erreur lors de la sauvegarde. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCorrect() {
    if (!aboutText.trim()) return;
    setCorrecting(true);
    try {
      const res = await fetch("/api/presentation/ai-correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aboutText, context: "about" }),
      });
      const data = await res.json();
      if (data.text) {
        setLastText(aboutText);
        setAboutText(data.text);
      }
    } catch {
      toast.error("Erreur lors de la correction IA. Réessayez.");
    } finally {
      setCorrecting(false);
    }
  }

  function handleUndo() {
    if (!lastText) return;
    setAboutText(lastText);
    setLastText(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface">Page À propos</h3>
          <p className="text-sm text-on-surface-variant/70 mt-1">
            Présentez votre histoire, vos valeurs et votre expertise.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lastText && (
            <button
              type="button"
              onClick={handleUndo}
              className="h-9 px-3 rounded-lg border border-outline-variant/30 text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 hover:bg-surface-container transition-colors"
              title="Annuler la correction"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Annuler
            </button>
          )}
          <button
            type="button"
            onClick={handleCorrect}
            disabled={correcting || !aboutText.trim()}
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
          Texte de présentation{" "}
          <span className="text-on-surface-variant/40 font-normal">(3-5 phrases)</span>
        </label>
        <textarea
          value={aboutText}
          onChange={e => setAboutText(e.target.value)}
          rows={8}
          placeholder="Présentez votre parcours, vos valeurs, ce qui vous différencie. Ex : Je suis architecte à Abidjan depuis 15 ans. J'accompagne les familles de la diaspora dans la construction de leur maison, de la conception jusqu'à la livraison..."
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500 resize-none transition-colors"
        />
        <p className="text-xs text-on-surface-variant/50">
          Ce texte apparaîtra sur votre page À propos publique ainsi que sur votre profil.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold text-sm text-on-surface flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-on-surface-variant/50" />
          Image de présentation{" "}
          <span className="text-on-surface-variant/40 font-normal">(URL, optionnel)</span>
        </label>
        <input
          type="url"
          value={aboutImageUrl}
          onChange={e => setAboutImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500 transition-colors"
        />
        {aboutImageUrl && (
          <div className="relative mt-2 rounded-xl overflow-hidden aspect-video max-w-xs border border-outline-variant/20">
            <Image src={aboutImageUrl} alt="Aperçu" fill className="object-cover" sizes="(max-width: 640px) 100vw, 320px" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !isDirty}
        className="h-10 px-5 rounded-xl bg-kelen-green-600 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kelen-green-700 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  );
}
