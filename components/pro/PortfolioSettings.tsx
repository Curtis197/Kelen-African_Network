"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon, Upload } from "lucide-react";
import { uploadFile } from "@/lib/supabase/storage";
import type { ProfessionalPortfolio } from "@/lib/supabase/types";

interface PortfolioSettingsProps {
  portfolio: ProfessionalPortfolio | null;
  professionalId: string;
  professionalSlug: string;
}

export function PortfolioSettings({
  portfolio,
  professionalId,
  professionalSlug,
}: PortfolioSettingsProps) {
  console.log("[PortfolioSettings] Initializing:", { portfolioId: portfolio?.id, professionalId });
  
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  
  const [heroImageUrl, setHeroImageUrl] = useState<string>(
    portfolio?.hero_image_url || ""
  );
  const [heroSubtitle, setHeroSubtitle] = useState<string>(
    portfolio?.hero_subtitle || "Votre partenaire de confiance"
  );
  const [aboutText, setAboutText] = useState<string>(
    portfolio?.about_text || ""
  );
  const [aboutImageUrl, setAboutImageUrl] = useState<string>(
    portfolio?.about_image_url || ""
  );
  const [cornerStyle, setCornerStyle] = useState<'square' | 'half-rounded' | 'rounded'>(
    ((portfolio as Record<string, unknown>)?.corner_style as 'square' | 'half-rounded' | 'rounded') ?? 'rounded'
  )
  const [colorMode, setColorMode] = useState<'light' | 'dark' | 'logo-color'>(
    ((portfolio as Record<string, unknown>)?.color_mode as 'light' | 'dark' | 'logo-color') ?? 'light'
  )

  const handleImageUpload = async (
    file: File,
    type: "hero" | "about"
  ) => {
    console.log("[PortfolioSettings] Uploading image:", type, file.name);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const path = `portfolios/${user.id}`;
      const url = await uploadFile(file, "portfolios", path);
      
      console.log("[PortfolioSettings] Image uploaded:", url);
      
      if (type === "hero") {
        setHeroImageUrl(url);
      } else {
        setAboutImageUrl(url);
      }
      
      toast.success("Image téléchargée avec succès");
    } catch (error) {
      console.error("[PortfolioSettings] Upload error:", error);
      toast.error("Erreur lors du téléchargement de l'image");
    }
  };

  const handleSave = async () => {
    console.log("[PortfolioSettings] Saving portfolio");
    setIsSaving(true);
    
    try {
      const { createOrUpdatePortfolio } = await import("@/lib/actions/portfolio");
      
      const result = await createOrUpdatePortfolio({
        hero_image_url: heroImageUrl || null,
        hero_subtitle: heroSubtitle || null,
        about_text: aboutText || null,
        about_image_url: aboutImageUrl || null,
        corner_style: cornerStyle,
        color_mode: colorMode,
      });
      
      console.log("[PortfolioSettings] Portfolio saved:", result?.id);
      toast.success("Portfolio mis à jour avec succès");
      router.refresh();
    } catch (error) {
      console.error("[PortfolioSettings] Save error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl bg-surface-container-low p-6">
      {/* Hero Section */}
      <div className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-on-surface">
          Section Héros (Bannière)
        </h3>
        
        {/* Hero Image Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">
            Image de bannière
          </label>
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-surface-container-lowest border-2 border-dashed border-outline-variant/30">
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt="Hero banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-on-surface-variant/40">
                <div className="text-center">
                  <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">Aucune image de bannière</p>
                </div>
              </div>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-kelen-green-50 px-4 py-2 text-sm font-medium text-kelen-green-700 transition-all hover:bg-kelen-green-100">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "hero");
              }}
            />
            {heroImageUrl ? "Changer l'image" : "Ajouter une image"}
          </label>
        </div>

        {/* Hero Subtitle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">
            Sous-titre du héros
          </label>
          <input
            type="text"
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Ex: Votre partenaire de confiance"
            className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-outline-variant/20" />

      {/* About Section */}
      <div className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-on-surface">
          Section "À propos"
        </h3>
        
        {/* About Image Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">
            Image "À propos" (optionnelle)
          </label>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-container-lowest border-2 border-dashed border-outline-variant/30">
            {aboutImageUrl ? (
              <img
                src={aboutImageUrl}
                alt="About section"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-on-surface-variant/40">
                <div className="text-center">
                  <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">Aucune image</p>
                </div>
              </div>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-kelen-green-50 px-4 py-2 text-sm font-medium text-kelen-green-700 transition-all hover:bg-kelen-green-100">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "about");
              }}
            />
            {aboutImageUrl ? "Changer l'image" : "Ajouter une image"}
          </label>
        </div>

        {/* About Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">
            Texte "À propos"
          </label>
          <textarea
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            placeholder="Présentez votre entreprise, votre expérience et vos valeurs..."
            rows={8}
            className="w-full rounded-xl bg-surface-container-lowest px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none resize-none"
          />
          <p className="text-xs text-on-surface-variant/60">
            {aboutText.length} caractères
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-outline-variant/20" />

      {/* Template customization */}
      <div className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-on-surface">
          Personnalisation du site
        </h3>

        {/* Corner style */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">Style des coins</label>
          <div className="flex gap-3">
            {(['square', 'half-rounded', 'rounded'] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setCornerStyle(style)}
                className={[
                  'flex-1 py-3 border-2 text-xs font-bold transition-colors',
                  style === 'square' ? 'rounded-none' : style === 'half-rounded' ? 'rounded-lg' : 'rounded-2xl',
                  cornerStyle === style ? 'border-[#009639] bg-green-50 text-[#009639]' : 'border-gray-200 text-gray-600',
                ].join(' ')}
              >
                {style === 'square' ? 'Carré' : style === 'half-rounded' ? 'Arrondi' : 'Très arrondi'}
              </button>
            ))}
          </div>
        </div>

        {/* Color mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-on-surface-variant">Mode couleur</label>
          <div className="flex gap-3">
            {(['light', 'dark', 'logo-color'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setColorMode(mode)}
                className={[
                  'flex-1 py-3 border-2 rounded-lg text-xs font-bold transition-colors',
                  colorMode === mode ? 'border-[#009639] bg-green-50 text-[#009639]' : 'border-gray-200 text-gray-600',
                ].join(' ')}
              >
                {mode === 'light' ? '☀️ Clair' : mode === 'dark' ? '🌙 Sombre' : '🎨 Couleur logo'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-outline-variant/20" />

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-6 py-3 font-headline text-sm font-bold text-white shadow-lg shadow-kelen-green-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}
