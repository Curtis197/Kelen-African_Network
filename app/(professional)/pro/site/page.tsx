// app/(professional)/pro/site/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Globe, Lock, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SiteBuilder } from "@/components/portfolio/SiteBuilder";
import { CalendarSettings } from "@/components/calendar/CalendarSettings";

export const metadata: Metadata = {
  title: "Mon Site Web — Kelen Pro",
  description: "Personnalisez et publiez votre site portfolio sur votre propre domaine.",
};

export default async function MySitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const { data: pro, error: proError } = await supabase
    .from("professionals")
    .select("id, slug, business_name, category, status")
    .eq("user_id", user.id)
    .single();

  if (!pro) redirect("/pro/profil");

  const { data: portfolio } = await supabase
    .from("professional_portfolio")
    .select("copy_quiz_answers, hero_subtitle, about_text, about_image_url, custom_domain, domain_status, show_realizations_section, show_services_section, show_products_section, show_about_section, show_calendar_section")
    .eq("professional_id", pro.id)
    .single();

  const isPaid = true; // DEV MODE: paywall bypassed — restore check before production

  const { data: calendarTokens } = await supabase
    .from("pro_calendar_tokens")
    .select("google_email, slot_duration, buffer_time, advance_days, working_hours")
    .eq("pro_id", pro.id)
    .single();

  const subdomainUrl = `https://${pro.slug}.kelen.africa`;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Mon Site Web
        </h1>
        <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
          {isPaid
            ? "Personnalisez votre site et connectez votre propre domaine."
            : "Votre site gratuit est en ligne. Passez au plan Premium pour débloquer toutes les fonctionnalités."}
        </p>
      </div>

      {/* Subdomain URL card — visible to all */}
      <div className="rounded-2xl border border-kelen-green-200 bg-kelen-green-50/40 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-kelen-green-600" />
            <span className="text-sm font-semibold text-kelen-green-700">Votre adresse web</span>
          </div>
          <p className="font-mono text-base font-bold text-on-surface">
            {pro.slug}.kelen.africa
          </p>
          <p className="text-xs text-on-surface-variant/60">
            Partagez cette adresse avec vos clients — elle est disponible pour tout le monde.
          </p>
        </div>
        <a
          href={subdomainUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center gap-2 rounded-xl border border-kelen-green-600 px-5 text-sm font-bold text-kelen-green-600 transition-all hover:bg-kelen-green-600 hover:text-white shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Voir le site
        </a>
      </div>

      {/* Free tier info banner */}
      {!isPaid && (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 space-y-4">
          <h2 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
            <Lock className="w-4 h-4 text-on-surface-variant/40" />
            Plan gratuit — fonctionnalités incluses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              { label: "Page web à votre adresse kelen.africa", included: true },
              { label: "Héros, présentation et contact", included: true },
              { label: "Réalisations, services, produits (limités)", included: true },
              { label: "Personnalisation complète du style", included: false },
              { label: "Domaine personnalisé (ex: monentreprise.com)", included: false },
              { label: "SEO et référencement Google", included: false },
            ].map(({ label, included }) => (
              <div key={label} className="flex items-center gap-2">
                {included ? (
                  <CheckCircle className="w-4 h-4 text-kelen-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-on-surface-variant/30 shrink-0" />
                )}
                <span className={included ? "text-on-surface" : "text-on-surface-variant/50"}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/pro/abonnement"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-6 text-sm font-bold text-white shadow-[0_6px_12px_-3px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Passer au plan Premium →
          </Link>
        </div>
      )}

      {/* Site builder — paid only */}
      {isPaid && (
        <SiteBuilder
          pro={{ id: pro.id, slug: pro.slug, businessName: pro.business_name }}
          portfolio={portfolio}
          isPaid={isPaid}
        />
      )}

      <CalendarSettings
        proId={pro.id}
        calendarTokens={calendarTokens}
      />
    </div>
  );
}
