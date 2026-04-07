import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Star, MapPin, Verified, Phone, Mail, Smartphone, ChevronRight, User, Compass, Calendar, ShieldCheck, Award } from "lucide-react";
import Link from "next/link";
import { getUserProjects } from "@/lib/actions/projects";
import { AddToProjectDialog } from "@/components/projects/AddToProjectDialog";

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
    .select("business_name, description")
    .eq("slug", slug)
    .single();

  if (!pro) return { title: "Professionnel non trouvé | Kelen" };

  return {
    title: `${pro.business_name} | Portfolio Professionnel Kelen`,
    description: pro.description || `Consultez le profil de ${pro.business_name} sur Kelen.`,
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

  // Fetch reviews (simulated or real depending on table availability)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("professional_id", pro.id)
    .limit(3);

  const statusColors = {
    gold: "bg-amber-100 text-amber-700 border-amber-200",
    silver: "bg-slate-100 text-slate-700 border-slate-200",
    white: "bg-stone-100 text-stone-700 border-stone-200",
    red: "bg-red-100 text-red-700 border-red-200",
    black: "bg-black text-white border-black",
  };

  const currentStatus = (pro.status as keyof typeof statusColors) || "white";

  const { data: realRealizations } = await supabase
    .from("project_documents")
    .select("*")
    .eq("professional_id", pro.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const portfolioItems = realRealizations && realRealizations.length > 0 
    ? realRealizations.map(r => ({
        id: r.id,
        title: r.project_title,
        description: r.project_description,
        image: r.photo_urls?.[0] || "https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&q=80",
        location: r.project_date
      }))
    : [];

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[60vh] md:min-h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover"
              src={pro.hero_image_url || pro.portfolio_photos?.[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"}
              alt=""
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-0 md:items-center md:justify-start flex">
            <div className="bg-surface/70 backdrop-blur-2xl p-5 sm:p-6 md:p-10 rounded-2xl md:rounded-[2rem] border border-outline-variant/20 w-full md:w-[35vw] shadow-2xl">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                 <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] border ${statusColors[currentStatus]}`}>
                    Rang {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                 </span>
                 {pro.verified && (
                   <span className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-full bg-kelen-green-100 text-kelen-green-700 border border-kelen-green-200 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">
                     <Verified className="w-2 md:w-2.5 md:h-2.5 h-2.5" />
                     Vérifié
                   </span>
                 )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-stone-900 tracking-tighter leading-[1.1] mb-3 md:mb-4">
                {pro.business_name}
              </h1>

              <p className="text-sm md:text-lg text-stone-600 font-medium mb-4 md:mb-8 border-l-4 border-kelen-green-600 pl-3 md:pl-4 leading-relaxed line-clamp-2 md:line-clamp-none">
                {pro.hero_tagline || pro.description || pro.category}
              </p>

              <div className="flex flex-wrap gap-2 md:gap-3">
                <a href="#contact" className="bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2 hover:scale-[0.98] transition-all shadow-lg shadow-kelen-green-600/20">
                  Consulter Expert
                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                </a>
                {user && (
                  <AddToProjectDialog
                    professionalId={pro.id}
                    professionalName={pro.business_name}
                    userProjects={userProjects}
                  />
                )}
                <a href="#portfolio" className="bg-surface-container-high text-stone-900 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-surface-container-highest transition-all shadow-sm">
                  Voir Réalisations
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Section (Bento Grid) - Only shown if realizations exist */}
        {portfolioItems.length > 0 && (
        <section className="py-16 px-4 sm:px-6 md:py-32 lg:px-12 bg-surface" id="portfolio">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div>
                <span className="text-kelen-green-600 font-black tracking-[0.3em] uppercase text-xs">Excellence & Savoir-faire</span>
                <h2 className="text-4xl md:text-5xl font-black mt-4 text-stone-900 tracking-tight">Portfolio de Projets</h2>
              </div>
              <Link href={`/professionnels/${slug}/realisations`} className="text-kelen-green-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all duration-300 group">
                Voir toutes les réalisations
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
              {/* Featured Project - Always show first item */}
              <div className={`${portfolioItems.length === 1 ? 'md:col-span-12' : 'md:col-span-8'} group relative overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-white shadow-sm transition-all duration-500 hover:shadow-2xl`}>
                <Link href={`/professionnels/${slug}/realisations/${portfolioItems[0].id}`}>
                  <img
                    className="w-full aspect-[4/3] md:aspect-auto md:h-[600px] object-cover transition-transform duration-700 group-hover:scale-110"
                    src={portfolioItems[0].image}
                    alt={portfolioItems[0].title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 md:p-12">
                    <h3 className="text-white text-xl md:text-3xl font-black mb-2">{portfolioItems[0].title}</h3>
                    <p className="text-white/80 font-medium text-sm md:text-lg">{portfolioItems[0].location || 'Réalisation majeure'}</p>
                  </div>
                </Link>
              </div>

              {/* Secondary Projects Grid - Only show if more than 1 */}
              {portfolioItems.length > 1 && (
                <div className="md:col-span-4 grid grid-rows-2 gap-6 md:gap-8">
                  {portfolioItems.slice(1, 3).map((item) => (
                    <div key={item.id} className="group relative overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-stone-100 shadow-sm transition-all duration-500 hover:shadow-2xl">
                      <Link href={`/professionnels/${slug}/realisations/${item.id}`}>
                        <img
                          className="w-full aspect-[4/3] md:aspect-auto md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          src={item.image}
                          alt={item.title}
                        />
                        <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-6 md:p-8 text-center">
                          <div className="text-white">
                            <h3 className="text-lg md:text-2xl font-black mb-2">{item.title}</h3>
                            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/70">Détails du projet</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                  {/* Only show placeholder if exactly 2 items */}
                  {portfolioItems.length === 2 && (
                     <div className="bg-stone-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center">
                        <p className="text-stone-300 font-black uppercase tracking-widest text-xs p-8 text-center">Plus de projets à venir</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {/* Philosophy Section */}
        <section className="py-16 md:py-32 bg-stone-50 rounded-t-[3rem] md:rounded-none" id="about">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-10 md:gap-24 items-center">
              <div className="space-y-10">
                <div>
                  <span className="text-kelen-green-600 font-black tracking-[0.3em] uppercase text-xs">Notre Philosophie</span>
                  <h2 className="text-3xl md:text-5xl font-black mt-4 text-stone-900 tracking-tight leading-tight">Expertise & Engagement</h2>
                </div>

                <div className="space-y-8 text-lg text-stone-600 leading-relaxed font-medium">
                  {pro.about_text ? (
                    <p className="whitespace-pre-wrap">{pro.about_text}</p>
                  ) : (
                    <>
                      <p>
                        Avec plus de {pro.years_experience || "10"} ans d&apos;expérience dans le secteur de {pro.category.toLowerCase()}, nous accompagnons nos clients dans la réalisation de projets complexes avec une rigueur absolue.
                      </p>
                      <p>
                        Notre approche repose sur trois piliers fondamentaux : l&apos;innovation technique, le respect scrupuleux des normes de sécurité et une écoute attentive des besoins spécifiques de chaque maître d&apos;ouvrage.
                      </p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-12">
                  <div className="flex flex-col items-center text-center group p-3 md:p-4 bg-white rounded-2xl">
                    <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-stone-900 mb-2 md:mb-4 transition-transform group-hover:scale-110" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-stone-400">Fiabilité</span>
                  </div>
                  <div className="flex flex-col items-center text-center group p-3 md:p-4 bg-white rounded-2xl">
                    <Compass className="w-8 h-8 md:w-10 md:h-10 text-stone-900 mb-2 md:mb-4 transition-transform group-hover:scale-110" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-stone-400">Rigueur</span>
                  </div>
                  <div className="flex flex-col items-center text-center group p-3 md:p-4 bg-white rounded-2xl">
                    <Calendar className="w-8 h-8 md:w-10 md:h-10 text-stone-900 mb-2 md:mb-4 transition-transform group-hover:scale-110" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-stone-400">Délais</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-kelen-green-500/10 rounded-full blur-3xl z-0"></div>
                <img
                  className="rounded-[2rem] md:rounded-[3rem] w-full h-[350px] sm:h-[450px] md:h-[700px] object-cover relative z-10 shadow-3xl grayscale hover:grayscale-0 transition-all duration-1000 ease-out"
                  src={pro.portfolio_photos?.[6] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"}
                  alt="Le professionnel au travail"
                />
                {pro.profile_picture_url && (
                  <div className="hidden sm:block absolute -bottom-10 -right-6 bg-white p-4 md:p-6 rounded-[2rem] shadow-2xl z-20 border border-stone-100 flex items-center gap-4 max-w-xs">
                    <img
                      src={pro.profile_picture_url}
                      alt={pro.business_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-stone-900 text-sm">{pro.business_name}</p>
                      <p className="text-xs text-stone-500 font-medium">Status {currentStatus}</p>
                    </div>
                  </div>
                )}
                {!pro.profile_picture_url && (
                  <div className="hidden sm:block absolute -bottom-10 -right-6 bg-white p-6 md:p-10 rounded-[2rem] shadow-2xl z-20 border border-stone-100 max-w-xs">
                    <div className="flex items-center gap-6">
                      <div className="bg-amber-100 p-4 rounded-2xl">
                        <Award className="w-8 h-8 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-black text-stone-900 text-lg">Hautement Qualifié</p>
                        <p className="text-sm text-stone-500 font-bold uppercase tracking-widest mt-1">Status {currentStatus}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4 sm:px-6 md:py-32 bg-white" id="contact">
          <div className="max-w-4xl mx-auto">
            <div className="bg-stone-50 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-8 md:p-20 shadow-xl border border-stone-100 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 md:h-2 bg-gradient-to-r from-kelen-green-400 via-kelen-green-600 to-kelen-green-400"></div>

              <h2 className="text-3xl md:text-5xl font-black text-stone-900 mb-4 md:mb-6 tracking-tight">Prêt à démarrer ?</h2>
              <p className="text-base md:text-xl text-stone-500 font-medium mb-10 md:mb-16 max-w-2xl mx-auto leading-relaxed">
                Prenez contact dès aujourd&apos;hui pour une étude personnalisée de votre projet avec {pro.business_name}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 text-left mb-8 md:mb-16">
                <div className="space-y-6 md:space-y-8">
                  <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-kelen-green-600">Informations Professionnelles</h4>
                  <div className="space-y-3 md:space-y-4">
                    <p className="text-2xl md:text-3xl font-black text-stone-900 flex items-center gap-3 md:gap-4">
                      {pro.owner_name || pro.business_name}
                      <Verified className="text-kelen-green-600 w-5 h-5 md:w-6 md:h-6" />
                    </p>
                    <p className="text-base md:text-lg text-stone-600 font-bold">{pro.category}</p>
                    <p className="flex items-center gap-2 md:gap-3 text-stone-500 font-medium text-sm md:text-base">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                      {pro.city}, {pro.country}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4 flex flex-col justify-center">
                  <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-kelen-green-600">Accès Direct</h4>
                  <div className="space-y-2 md:space-y-3">
                    <a className="flex items-center justify-between bg-white px-4 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-2xl hover:bg-stone-100 transition-all group shadow-sm border border-stone-100" href={`tel:${pro.phone}`}>
                      <span className="flex items-center gap-2 md:gap-4 font-black text-stone-900 text-sm md:text-base">
                        <Phone className="w-4 h-4 md:w-5 md:h-5 text-stone-400 group-hover:text-stone-900" />
                        Appeler
                      </span>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
                    </a>
                    {pro.whatsapp && (
                      <a className="flex items-center justify-between bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 text-white px-4 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-2xl hover:opacity-90 transition-all group shadow-lg shadow-kelen-green-600/20" href={`https://wa.me/${pro.whatsapp.replace(/\+/g, '')}`}>
                        <span className="flex items-center gap-2 md:gap-4 font-black text-sm md:text-base">
                          <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
                          WhatsApp
                        </span>
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                    <a className="flex items-center justify-between border-2 border-stone-200 px-4 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-2xl hover:border-stone-900 transition-all group" href={`mailto:${pro.email}`}>
                      <span className="flex items-center gap-2 md:gap-4 font-black text-stone-900 text-sm md:text-base">
                        <Mail className="w-4 h-4 md:w-5 md:h-5 text-stone-400 group-hover:text-stone-900" />
                        Email
                      </span>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
