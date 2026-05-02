import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLogoUrl } from "@/lib/actions/branding";
import { IdentiteEditor } from "@/components/portfolio/IdentiteEditor";
import { Globe, FileText } from "lucide-react";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";

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

  const [{ data: portfolio }, logoUrl] = await Promise.all([
    supabase
      .from("professional_portfolio")
      .select("style_tokens")
      .eq("professional_id", pro.id)
      .maybeSingle(),
    getLogoUrl(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Identité Visuelle
        </h1>
        <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
          Logo, couleurs et style visuel — définis ici, appliqués partout.
        </p>
      </div>

      {/* Impact banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-kelen-green-50">
            <Globe className="w-[18px] h-[18px] text-kelen-green-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-on-surface">Site web</p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5 leading-relaxed">
              Ambiance, coins, densité et poids visuel de votre page publique.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <FileText className="w-[18px] h-[18px] text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-on-surface">Documents imprimables</p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5 leading-relaxed">
              Portfolio PDF et catalogue — vos couleurs de marque remplacent le vert Kelen.
            </p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <IdentiteEditor
        slug={pro.slug}
        initialLogoUrl={logoUrl}
        initialBrandPrimary={pro.brand_primary ?? null}
        initialBrandSecondary={pro.brand_secondary ?? null}
        initialBrandAccent={pro.brand_accent ?? null}
        initialStyleTokens={(portfolio?.style_tokens as Partial<StyleAnswers>) ?? {}}
      />
    </div>
  );
}
