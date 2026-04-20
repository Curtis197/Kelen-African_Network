// app/(professional)/pro/site/page.tsx
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteBuilder } from "@/components/portfolio/SiteBuilder";

export const metadata: Metadata = {
  title: "Mon Site Web — Kelen Pro",
  description: "Personnalisez et publiez votre site portfolio sur votre propre domaine.",
};

export default async function MySitePage() {
  console.log('[ACTION] MySitePage: start');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const { data: pro, error: proError } = await supabase
    .from("professionals")
    .select("id, slug, business_name, category, status")
    .eq("user_id", user.id)
    .single();

  console.log('[DB] MySitePage professionals query:', {
    hasData: !!pro,
    hasError: !!proError,
    errorMessage: proError?.message,
    errorCode: proError?.code,
  });
  if (proError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professionals, User:', user.id);
  }

  if (!pro) redirect("/pro/profil");

  const { data: portfolio, error: portfolioError } = await supabase
    .from("professional_portfolio")
    .select("style_tokens, copy_quiz_answers, hero_subtitle, about_text, about_image_url, custom_domain, domain_status, show_realizations_section, show_services_section, show_products_section, show_about_section")
    .eq("professional_id", pro.id)
    .single();

  console.log('[DB] MySitePage professional_portfolio query:', {
    hasData: !!portfolio,
    hasError: !!portfolioError,
    errorMessage: portfolioError?.message,
    errorCode: portfolioError?.code,
  });
  if (portfolioError?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professional_portfolio, User:', user.id);
  }

  const isPaid = pro.status === "gold" || pro.status === "silver";
  console.log('[ACTION] MySitePage: done', { proId: pro.id, isPaid, hasPortfolio: !!portfolio });

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Mon Site Web
        </h1>
        <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
          Créez votre site portfolio en 2 minutes. L&apos;aperçu est gratuit — le domaine est réservé aux membres Gold et Silver.
        </p>
      </div>

      <SiteBuilder
        pro={{ id: pro.id, slug: pro.slug, businessName: pro.business_name }}
        portfolio={portfolio}
        isPaid={isPaid}
      />
    </div>
  );
}
