import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLogoUrl } from "@/lib/actions/branding";
import { LogoUploader } from "@/components/portfolio/LogoUploader";
import { BrandThemePicker } from "@/components/portfolio/BrandThemePicker";
import { Globe, FileText, Palette } from "lucide-react";
import type { ColorMode } from "@/lib/pro-site/types";

export const metadata: Metadata = {
  title: "Identité Visuelle — Kelen Pro",
  description: "Définissez l'image de marque appliquée à votre site web et à vos documents.",
};

export default async function IdentiteVisuellePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, slug, brand_primary, brand_secondary, brand_accent")
    .eq("user_id", user.id)
    .single();

  if (!pro) redirect("/pro/profil");

  const { data: portfolio } = await supabase
    .from("professional_portfolio")
    .select("color_mode")
    .eq("professional_id", pro.id)
    .maybeSingle();

  const logoUrl = await getLogoUrl();
  const currentColorMode = (portfolio?.color_mode as ColorMode | null) ?? "light";

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Identité Visuelle
        </h1>
        <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
          Votre logo et vos couleurs de marque s'appliquent automatiquement sur votre site web et vos documents imprimables.
        </p>
      </div>

      {/* Impact banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-kelen-green-50">
            <Globe className="w-4.5 h-4.5 text-kelen-green-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-on-surface">Site web</p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5 leading-relaxed">
              Couleurs, ambiance et style visuel de votre page professionnelle publique.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <FileText className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-on-surface">Documents imprimables</p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5 leading-relaxed">
              Portfolio PDF, catalogue et devis — vos couleurs de marque remplacent le vert Kelen.
            </p>
          </div>
        </div>
      </div>

      {/* Main editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Logo & palette */}
        <section className="rounded-2xl border border-outline-variant/20 bg-white p-6 space-y-6">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-kelen-green-600" />
            <h2 className="font-headline text-lg font-bold text-on-surface">Logo & palette</h2>
          </div>

          <LogoUploader
            initialLogoUrl={logoUrl}
            initialBrandPrimary={pro.brand_primary ?? null}
          />

          {/* Brand palette display */}
          {(pro.brand_primary || pro.brand_secondary || pro.brand_accent) && (
            <div className="space-y-2 pt-2 border-t border-outline-variant/15">
              <p className="text-xs font-medium text-on-surface-variant/60">Palette enregistrée</p>
              <div className="flex gap-3">
                {[
                  { color: pro.brand_primary, label: "Principale" },
                  { color: pro.brand_secondary, label: "Secondaire" },
                  { color: pro.brand_accent, label: "Accent" },
                ]
                  .filter((c) => c.color)
                  .map(({ color, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-xl border border-outline-variant/20 shadow-sm"
                        style={{ background: color! }}
                      />
                      <span className="text-[9px] font-mono text-on-surface-variant/50">
                        {color}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/40">{label}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* Theme picker */}
        <section className="rounded-2xl border border-outline-variant/20 bg-white p-6 space-y-6">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-kelen-green-600" />
            <h2 className="font-headline text-lg font-bold text-on-surface">Ambiance</h2>
          </div>

          <BrandThemePicker
            initialMode={currentColorMode}
            brandPrimary={pro.brand_primary ?? null}
          />
        </section>
      </div>
    </div>
  );
}
