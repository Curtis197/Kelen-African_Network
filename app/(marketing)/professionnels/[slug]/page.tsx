import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Verified, Phone, Mail, Smartphone, ChevronRight, Compass, Calendar, ShieldCheck, Award } from "lucide-react";
import Link from "next/link";
import { getUserProjects } from "@/lib/actions/projects";
import { AddToProjectDialog } from "@/components/projects/AddToProjectDialog";
import RecommandationScrollRow from "@/components/recommandations/RecommandationScrollRow";
import { getLatestRecommandations, getRecommandationCount } from "@/lib/actions/professional-recommandations";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, description, category, city, country, photo_url, status")
    .eq("slug", slug)
    .single();

  if (!pro) return { title: "Professionnel non trouvé | Kelen" };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelen.africa';
  const profileUrl = `${baseUrl}/professionnels/${slug}`;

  // Build description with context
  const locationParts = [pro.city, pro.country].filter(Boolean).join(', ');
  const categoryLabel = pro.category ? pro.category.charAt(0).toUpperCase() + pro.category.slice(1) : 'Professionnel';
  const description = pro.description
    || `${categoryLabel} basé${locationParts ? ` à ${locationParts}` : ''}. Consultez son portfolio et ses recommandations vérifiées sur Kelen.`;

  // Free profiles: noindex
  // Paid profiles: full indexing (subscription check when payment is implemented)
  const isPaid = pro.status === 'gold' || pro.status === 'silver';

  return {
    title: `${pro.business_name} — ${categoryLabel}${locationParts ? ` à ${locationParts}` : ''} | Kelen`,
    description,
    robots: {
      index: isPaid,
      follow: true,
    },
    openGraph: {
      title: `${pro.business_name} — ${categoryLabel} sur Kelen`,
      description,
      type: 'profile',
      url: profileUrl,
      siteName: 'Kelen',
      locale: 'fr_FR',
      images: pro.photo_url
        ? [{ url: pro.photo_url, width: 1200, height: 630, alt: pro.business_name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pro.business_name} — ${categoryLabel} sur Kelen`,
      description,
      images: pro.photo_url ? [pro.photo_url] : [],
    },
    alternates: {
      canonical: profileUrl,
    },
  };
}

export default async function ProfessionalProfilePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pro) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const userProjects = user ? await getUserProjects() : [];

  const statusColors = {
    gold: "bg-amber-100 text-amber-700 border-amber-200",
    silver: "bg-slate-100 text-slate-700 border-slate-200",
    white: "bg-stone-100 text-stone-700 border-stone-200",
    red: "bg-red-100 text-red-700 border-red-200",
    black: "bg-black text-white border-black",
  };

  const currentStatus = (pro.status as keyof typeof statusColors) || "white";

  // Fetch professional portfolio (about_text, hero content, etc.)
  const { data: portfolio } = await supabase
    .from("professional_portfolio")
    .select("*")
    .eq("professional_id", pro.id)
    .single();

  // Fetch realizations with their images
  const { data: realizations } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*)
    `)
    .eq("professional_id", pro.id)
    .order("created_at", { ascending: false });

  // Map realizations to portfolio items format
  const portfolioItems = realizations && realizations.length > 0
    ? realizations.map(r => {
        const mainImage = r.images?.find((img: any) => img.is_main) || r.images?.[0];
        return {
          id: r.id,
          title: r.title,
          description: r.description || "",
          image: mainImage?.url || "https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&q=80",
          location: r.location,
          price: r.price,
          currency: r.currency || "XOF"
        };
      })
    : [];

  // Use portfolio data for hero and about sections
  const heroImage = portfolio?.hero_image_url || pro.portfolio_photos?.[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80";
  const heroTagline = portfolio?.hero_title || pro.hero_tagline || pro.description || pro.category;
  const aboutText = portfolio?.about_text;
  const aboutImage = portfolio?.about_image_url;

  // Fetch recommendations for social proof
  const recommandationCount = await getRecommandationCount(pro.id);
  const latestRecommandations = await getLatestRecommandations(pro.id, 5);

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main>
        {/* Hero Section — Full-bleed 80vh */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover"
              src={heroImage}
              alt=""
            />
            <div className="absolute inset-0 bg-on-surface/30"></div>
          </div>
        </section>

        {/* Overlapping Hero Card — 20% overlap (16vh of 80vh) */}
        <div className="relative z-20 -mt-[16vh] px-4 sm:px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-surface-container-lowest p-8 sm:p-10 md:p-16 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_40px_60px_-12px_rgba(0,0,0,0.15)] border border-outline-variant/10 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-10">
                {/* Left: Title, Tagline, Buttons */}
                <div className="flex-1">
                  {/* Status Badges */}
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${statusColors[currentStatus]}`}>
                      Rang {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </span>
                    {pro.verified && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em]">
                        <Verified className="w-2.5 h-2.5" />
                        Vérifié
                      </span>
                    )}
                  </div>

                  {/* Portfolio Hero Title */}
                  {portfolio?.hero_title && (
                    <h2 className="font-headline font-bold text-xl sm:text-2xl md:text-3xl tracking-tight text-primary mb-2 leading-tight">
                      {portfolio.hero_title}
                    </h2>
                  )}

                  <h1 className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tighter text-on-surface mb-4 leading-tight">
                    {pro.business_name}
                  </h1>

                  {/* Portfolio Hero Subtitle */}
                  {portfolio?.hero_subtitle && (
                    <p className="font-body text-base md:text-lg text-on-surface-variant/80 font-medium mb-6">
                      {portfolio.hero_subtitle}
                    </p>
                  )}

                  <p className="font-body text-lg md:text-xl text-on-surface-variant font-medium italic mb-8 border-l-4 border-primary pl-6">
                    {heroTagline}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <a href="#contact" className="bg-primary text-on-primary px-6 md:px-8 py-3 md:py-4 rounded-md font-bold text-sm md:text-base flex items-center gap-2 hover:scale-[0.98] transition-transform">
                      Consulter Expert
                      <ChevronRight className="w-4 h-4" />
                    </a>
                    {user && (
                      <AddToProjectDialog
                        professionalId={pro.id}
                        professionalName={pro.business_name}
                        userProjects={userProjects}
                      />
                    )}
                    <Link href={`/professionnels/${slug}/realisations`} className="bg-surface-container-high text-on-surface px-6 md:px-8 py-3 md:py-4 rounded-md font-bold text-sm md:text-base hover:bg-surface-container-highest transition-colors">
                      Voir Réalisations
                    </Link>
                  </div>
                </div>

                {/* Right: Stats Grid (Desktop) */}
                <div className="hidden lg:grid grid-cols-2 gap-6 p-8 bg-surface-container-low rounded-xl">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Expérience</p>
                    <p className="font-headline font-bold text-on-surface">{pro.years_of_experience || '—'} Ans</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Localisation</p>
                    <p className="font-headline font-bold text-on-surface">{pro.city}{pro.country ? `, ${pro.country}` : ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Spécialité</p>
                    <p className="font-headline font-bold text-on-surface">{pro.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Statut</p>
                    <div className="flex items-center gap-1">
                      <Verified className="w-4 h-4 text-primary" />
                      <p className="font-headline font-bold text-on-surface">Expert Vérifié</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid (Mobile/Tablet) */}
              <div className="lg:hidden grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-outline-variant/10">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Expérience</p>
                  <p className="font-headline font-bold text-on-surface">{pro.years_of_experience || '—'} Ans</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Localisation</p>
                  <p className="font-headline font-bold text-on-surface">{pro.city}{pro.country ? `, ${pro.country}` : ''}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Spécialité</p>
                  <p className="font-headline font-bold text-on-surface">{pro.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Statut</p>
                  <div className="flex items-center gap-1">
                    <Verified className="w-4 h-4 text-primary" />
                    <p className="font-headline font-bold text-on-surface">Expert Vérifié</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Section (Refactored Layout) - Only shown if realizations exist */}
        {portfolioItems.length > 0 && (
        <section className="py-24 px-4 sm:px-6 md:px-8 bg-surface" id="portfolio">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">Excellence en Construction</span>
                <h2 className="font-headline font-bold text-4xl mt-2 text-on-surface">Nos Réalisations</h2>
              </div>
              <div className="h-px flex-grow bg-outline-variant/20 mx-8 hidden md:block"></div>
              <p className="text-on-surface-variant max-w-xs font-medium italic">Une sélection de projets d&apos;exception alliant précision technique et esthétique contemporaine.</p>
            </div>

            {/* Projects Stack */}
            <div className="space-y-8">
              {/* Featured Project (100% Width) */}
              <div className="group relative h-[500px] md:h-[600px] overflow-hidden rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_40px_60px_-12px_rgba(0,0,0,0.15)] bg-surface-container-lowest">
                <Link href={`/professionnels/${slug}/realisations/${portfolioItems[0].id}`}>
                  <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={portfolioItems[0].image}
                    alt={portfolioItems[0].title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                    <div className="max-w-2xl">
                      <span className="bg-primary text-on-primary px-3 py-1 rounded text-xs font-bold uppercase tracking-widest mb-4 inline-block">Projet Phare</span>
                      <h3 className="text-white font-headline font-extrabold text-4xl md:text-5xl mb-4 leading-tight">{portfolioItems[0].title}</h3>
                      <p className="text-white/80 font-body text-lg leading-relaxed">{portfolioItems[0].description}</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Secondary Projects (50/50 Grid) */}
              {portfolioItems.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {portfolioItems.slice(1, 3).map((item) => (
                    <div key={item.id} className="group bg-surface-container-lowest rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-outline-variant/10 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
                      <Link href={`/professionnels/${slug}/realisations/${item.id}`} className="flex-grow flex flex-col">
                        <div className="h-80 overflow-hidden">
                          <img
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            src={item.image}
                            alt={item.title}
                          />
                        </div>
                        <div className="p-8 flex-grow">
                          <h4 className="font-headline font-bold text-2xl text-on-surface mb-3">{item.title}</h4>
                          <p className="text-on-surface-variant font-body leading-relaxed">{item.description || item.location || ''}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {/* Philosophy Section - Only shown if about_text exists */}
        {aboutText && (
        <section className="py-24 bg-surface-container-low" id="about">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">Notre Philosophie</span>
                  <h2 className="font-headline font-bold text-4xl mt-2 text-on-surface">À propos</h2>
                </div>

                <div className="space-y-6 text-lg text-on-surface-variant leading-relaxed">
                  <p className="whitespace-pre-wrap">{aboutText}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-12 border-t border-outline-variant/30">
                  <div className="flex flex-col items-center text-center">
                    <ShieldCheck className="text-on-surface mb-2" style={{ fontSize: 32 }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Fiabilité</span>
                  </div>
                  <div className="flex flex-col items-center text-center border-x border-outline-variant/30 px-4">
                    <Compass className="text-on-surface mb-2" style={{ fontSize: 32 }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Rigueur</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Calendar className="text-on-surface mb-2" style={{ fontSize: 32 }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Délais</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full z-0"></div>
                <img
                  className="rounded-2xl w-full h-[600px] object-cover relative z-10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
                  src={aboutImage || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"}
                  alt="Le professionnel au travail"
                />
                <div className="hidden sm:block absolute -bottom-6 -right-6 bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-lg z-20 border border-outline-variant/10">
                  {pro.profile_picture_url ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={pro.profile_picture_url}
                        alt={pro.business_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-on-surface">{pro.business_name}</p>
                        <p className="text-sm text-on-surface-variant">Certification Kelen Gold</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="bg-secondary-container p-3 rounded-full">
                        <Award className="w-6 h-6 text-on-secondary-container" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Professionnel Vérifié</p>
                        <p className="text-sm text-on-surface-variant">Certification Kelen Gold</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Recommandations Section - Social Proof */}
        {recommandationCount > 0 && (
        <section className="py-16 px-4 sm:px-6 md:py-32 bg-stone-50">
          <div className="max-w-7xl mx-auto">
            <RecommandationScrollRow 
              recommandations={latestRecommandations}
              totalCount={recommandationCount}
            />
            <div className="mt-8 text-center">
              <Link href={`/professionnels/${slug}/recommandations`} className="text-kelen-green-600 font-semibold flex items-center justify-center gap-2 hover:gap-3 transition-all duration-300 group">
                Voir toutes les recommandations
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
        )}

        {/* Contact Section */}
        <section className="py-24 px-4 sm:px-6 md:px-8 bg-surface" id="contact">
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface-container-lowest rounded-2xl p-10 md:p-16 shadow-xl border border-outline-variant/10 text-center">
              <h2 className="font-headline font-bold text-3xl text-on-surface mb-2">Prêt à démarrer votre projet ?</h2>
              <p className="text-on-surface-variant font-medium mb-12">Contactez {pro.business_name} pour une consultation professionnelle.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-12">
                {/* Left: Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Informations</h4>
                  <div className="space-y-2">
                    <p className="text-2xl font-headline font-bold text-on-surface flex items-center gap-3">
                      {pro.owner_name || pro.business_name}
                      <Verified className="text-secondary text-base" />
                    </p>
                    <p className="text-lg text-on-surface-variant">{pro.category}</p>
                    <p className="flex items-center gap-2 text-on-surface-variant">
                      <MapPin className="w-4 h-4" />
                      {pro.city}, {pro.country}
                    </p>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="space-y-4 flex flex-col justify-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Action Directe</h4>
                  <div className="flex flex-col gap-3">
                    <a className="flex items-center justify-between bg-surface-container-high px-6 py-4 rounded-lg hover:bg-surface-container-highest transition-colors group" href={`tel:${pro.phone}`}>
                      <span className="flex items-center gap-3 font-bold">
                        <Phone className="w-5 h-5" />
                        Appeler
                      </span>
                      <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {pro.whatsapp && (
                      <a className="flex items-center justify-between bg-primary-container text-on-primary-container px-6 py-4 rounded-lg hover:opacity-90 transition-opacity group" href={`https://wa.me/${pro.whatsapp.replace(/\+/g, '')}`}>
                        <span className="flex items-center gap-3 font-bold">
                          <Smartphone className="w-5 h-5" />
                          WhatsApp
                        </span>
                        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    <a className="flex items-center justify-between border-2 border-outline-variant/30 px-6 py-4 rounded-lg hover:border-primary transition-colors group" href={`mailto:${pro.email}`}>
                      <span className="flex items-center gap-3 font-bold">
                        <Mail className="w-5 h-5" />
                        Email
                      </span>
                      <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface-container-low w-full py-12 px-4 sm:px-6 md:px-8 border-t border-outline-variant/10">
          <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-7xl mx-auto gap-6">
            <div className="font-headline font-bold text-on-surface text-lg">Kelen</div>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="/privacy" className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
            <p className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant">
              © 2026 Kelen Diaspora. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
