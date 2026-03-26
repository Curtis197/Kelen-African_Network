import type { Metadata } from "next";
import Link from "next/link";
import { ProfileHero } from "@/components/shared/ProfileHero";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import { SignalCard } from "@/components/shared/SignalCard";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { formatTenure, formatRating, formatNumber, getCountryName } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, recommendation_count")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return { title: "Professionnel non trouvé" };
  }
  return {
    title: `${pro.business_name} — Digital Portfolio`,
    description: `Consultez le profil vérifié de ${pro.business_name} sur Kelen. ${pro.recommendation_count} projets vérifiés avec succès.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Professional
  const { data: pro, error: proError } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (proError || !pro) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-on-surface">
          Professionnel non trouvé
        </h1>
        <p className="mt-3 text-on-surface-variant/70">
          Ce professionnel n&apos;est pas encore référencé dans notre réseau d&apos;excellence.
        </p>
        <Link
          href="/recherche"
          className="mt-6 inline-flex rounded-xl bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform"
        >
          Découvrir nos experts
        </Link>
      </div>
    );
  }

  // 2. Fetch Verified Recommendations
  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("*")
    .eq("professional_id", pro.id)
    .eq("status", "verified")
    .order("completion_date", { ascending: false });

  // 3. Fetch Verified Signals
  const { data: signals } = await supabase
    .from("signals")
    .select("*")
    .eq("professional_id", pro.id)
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  // 4. Fetch Reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("professional_id", pro.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  const isRed = pro.status === "red";
  const isBlack = pro.status === "black";

  return (
    <main className="min-h-screen bg-surface selection:bg-primary/20">
      {/* 1. Hero Section */}
      <ProfileHero 
        businessName={pro.business_name}
        tagline={pro.tagline || `${pro.category} d'excellence basé à ${pro.city}`}
        backgroundImage={pro.cover_photo}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 2. Editorial Stats Bar */}
        <div className="relative -mt-16 z-20">
          <div className="bg-surface-container-highest rounded-3xl p-8 md:p-12 shadow-2xl flex flex-wrap items-center justify-between gap-8 border border-outline-variant/10 leading-none">
            <div className="flex-1 min-w-[140px] border-r border-outline-variant/20 last:border-0 pr-8">
              <span className="block text-4xl md:text-5xl font-headline font-black text-primary mb-2">
                {pro.recommendation_count}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                PROJETS VÉRIFIÉS
              </span>
            </div>
            <div className="flex-1 min-w-[140px] border-r border-outline-variant/20 last:border-0 pr-8">
              <span className="block text-4xl md:text-5xl font-headline font-black text-on-surface mb-2">
                {pro.avg_rating ? formatRating(pro.avg_rating) : "—"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                NOTE KELEN
              </span>
            </div>
            <div className="flex-1 min-w-[140px] border-r border-outline-variant/20 last:border-0 pr-8">
              <span className="block text-4xl md:text-5xl font-headline font-black text-on-surface mb-2">
                {formatTenure(pro.created_at).split(' ')[0]}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                ANS D&apos;EXPERTISE
              </span>
            </div>
            <div className="flex-1 min-w-[140px] pr-8">
              <span className="block text-4xl md:text-5xl font-headline font-black text-on-surface mb-2">
                {formatNumber(pro.review_count)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
                AVIS CLIENTS
              </span>
            </div>
          </div>
        </div>

        {/* Alerts & Verification Banner */}
        <div className="mt-12 space-y-4">
          {isRed && (
            <div className="rounded-2xl bg-error-container p-6 border border-error/20 flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>report</span>
              <p className="font-bold text-on-error-container text-lg">
                VIGILANCE : Ce professionnel fait l&apos;objet d&apos;un signalement vérifié.
              </p>
            </div>
          )}
          {isBlack && (
            <div className="rounded-2xl bg-[#1A1A1A] p-6 border border-white/10 flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-white">block</span>
              <p className="font-bold text-white text-lg">
                RÉVOQUÉ : Plusieurs manquements contractuels graves ont été confirmés.
              </p>
            </div>
          )}
        </div>

        {/* 3. Main Grid Layout */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-24">
          
          {/* Main Content (Bento Grid Style) */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* Recommendations Section */}
            <section id="portfolio">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-on-surface flex items-center gap-3">
                  Réalisations Signature
                  <span className="text-primary font-normal text-lg">({recommendations?.length || 0})</span>
                </h2>
                <div className="hidden md:flex gap-2">
                  <div className="h-0.5 w-12 bg-primary rounded-full"></div>
                  <div className="h-0.5 w-4 bg-outline-variant/30 rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations?.map((rec: any, idx: number) => (
                  <div key={rec.id} className={idx === 0 ? "md:col-span-2" : ""}>
                    <RecommendationCard {...rec} />
                  </div>
                ))}
                {(!recommendations || recommendations.length === 0) && (
                  <div className="md:col-span-2 p-12 rounded-3xl bg-surface-container-low border border-dashed border-outline-variant text-center">
                    <p className="text-on-surface-variant/60 font-medium italic">
                      Aucune réalisation n&apos;a encore été validée par nos inspecteurs.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Signals Section (Only if present) */}
            {(signals && signals.length > 0) && (
              <section id="signals">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-on-surface flex items-center gap-3">
                    Historique de Conformité
                    <span className="text-error font-normal text-lg">({signals.length})</span>
                  </h2>
                </div>
                <div className="space-y-6">
                  {signals.map((sig: any) => (
                    <SignalCard key={sig.id} {...sig} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <section id="reviews">
              <div className="flex items-center justify-between mb-8 border-b border-outline-variant/10 pb-6">
                <h2 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-on-surface">
                  Expérience Client
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-on-surface">{formatRating(pro.avg_rating || 0)}</span>
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews?.map((rev: any) => (
                  <ReviewCard key={rev.id} {...rev} />
                ))}
                {(!reviews || reviews.length === 0) && (
                  <div className="md:col-span-2 p-8 rounded-2xl bg-surface-container-low text-center">
                    <p className="text-on-surface-variant/60 italic">Aucun avis publié.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar (Bento Panel Style) */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* About Card */}
            <div className="bg-surface-container-low rounded-3xl p-8 shadow-sm">
              <h3 className="font-headline font-extrabold text-xl mb-6 text-on-surface uppercase tracking-widest text-[10px] opacity-40">Identité & Expertise</h3>
              <p className="font-body text-on-surface-variant leading-relaxed mb-8">
                {pro.description || "Établissement d'excellence spécialisé dans les solutions innovantes."}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                    <span className="material-symbols-outlined text-sm">home</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none">Siège Social</p>
                    <p className="font-bold text-on-surface">{pro.city}, {pro.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                    <span className="material-symbols-outlined text-sm">work</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none">Spécialité</p>
                    <p className="font-bold text-on-surface">{pro.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Card */}
            {pro.services_offered && pro.services_offered.length > 0 && (
              <div className="bg-surface-container-low rounded-3xl p-8 shadow-sm">
                <h3 className="font-headline font-extrabold text-xl mb-6 text-on-surface uppercase tracking-widest text-[10px] opacity-40">Périmètre d&apos;activité</h3>
                <div className="flex flex-wrap gap-2">
                  {pro.services_offered.map((service: string) => (
                    <span key={service} className="px-4 py-2 rounded-xl bg-surface-container-highest text-on-surface text-xs font-bold border border-outline-variant/10">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact CTA Card */}
            <div id="contact" className="bg-on-surface rounded-3xl p-8 shadow-xl text-surface">
              <h3 className="font-headline font-black text-2xl mb-2">Engager l&apos;Expert</h3>
              <p className="text-surface/60 text-sm mb-8">Accélérez votre projet avec une signature d&apos;excellence.</p>
              
              <div className="space-y-3">
                <a href={`tel:${pro.phone}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">call</span>
                    <span className="font-bold text-sm tracking-tight">{pro.phone}</span>
                  </div>
                  <span className="material-symbols-outlined text-xs opacity-40">arrow_forward</span>
                </a>
                
                {pro.whatsapp && (
                  <a href={`https://wa.me/${pro.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" className="flex items-center justify-between p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors text-[#25D366]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">message</span>
                      <span className="font-bold text-sm tracking-tight">Direct WhatsApp</span>
                    </div>
                    <span className="material-symbols-outlined text-xs opacity-40">open_in_new</span>
                  </a>
                )}

                <a href={`mailto:${pro.email}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">mail</span>
                    <span className="font-bold text-sm tracking-tight">Email Professionnel</span>
                  </div>
                  <span className="material-symbols-outlined text-xs opacity-40">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
              <Link href={`/recommandation/${pro.slug}`} className="flex items-center justify-center gap-2 p-5 rounded-3xl bg-surface-container-highest border border-outline-variant/30 font-bold text-on-surface hover:bg-primary hover:text-on-primary hover:border-transparent transition-all group">
                Recommander ce Pro
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">add_task</span>
              </Link>
              <Link href={`/avis/${pro.slug}`} className="flex items-center justify-center gap-2 p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 font-bold text-on-surface-variant hover:bg-on-surface hover:text-surface transition-all">
                Soumettre un Avis
                <span className="material-symbols-outlined text-xl">reviews</span>
              </Link>
              <Link href={`/signal/${pro.slug}`} className="flex items-center justify-center gap-2 p-4 text-error font-bold text-xs uppercase tracking-widest hover:opacity-70 transition-opacity">
                SIGNALER UN DIFFÉREND
                <span className="material-symbols-outlined text-sm">flag</span>
              </Link>
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}
