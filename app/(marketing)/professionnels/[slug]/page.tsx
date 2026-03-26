import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Star, MapPin, Verified, Phone, Mail, MessageCircle, ChevronRight, User, Compass, Calendar, ShieldCheck, Award } from "lucide-react";
import Link from "next/link";

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
    .from("professional_realizations")
    .select(`
      *,
      realization_images(*)
    `)
    .eq("professional_id", pro.id)
    .order("created_at", { ascending: false });

  // Use real realizations if available, otherwise fallback to placeholder logic
  const portfolioItems = realRealizations && realRealizations.length > 0 
    ? realRealizations.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        image: (r.realization_images as any[])?.find((img: any) => img.is_main)?.url || (r.realization_images as any[])?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&q=80",
        location: r.location
      }))
    : [];

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover" 
              src={pro.portfolio_photos?.[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"} 
              alt={pro.business_name}
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-6xl px-6">
            <div className="bg-white/80 backdrop-blur-2xl p-10 md:p-16 rounded-[2.5rem] border border-white/20 max-w-4xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${statusColors[currentStatus]}`}>
                    Rang {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                 </span>
                 {pro.verified && (
                   <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-kelen-green-100 text-kelen-green-700 border border-kelen-green-200 text-[10px] font-black uppercase tracking-[0.2em]">
                     <Verified className="w-3 h-3" />
                     Vérifié par Kelen
                   </span>
                 )}
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-stone-900 tracking-tighter leading-[0.9] mb-8">
                {pro.business_name}
              </h1>
              
              <p className="text-xl md:text-2xl text-stone-600 font-medium mb-12 border-l-4 border-kelen-green-600 pl-8 max-w-2xl leading-relaxed">
                {pro.description || pro.category}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a href="#contact" className="bg-kelen-green-600 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 hover:scale-[0.98] transition-all shadow-xl shadow-kelen-green-600/20">
                  Contacter l&apos;expert
                  <ChevronRight className="w-5 h-5" />
                </a>
                <a href="#portfolio" className="bg-white text-stone-900 px-10 py-5 rounded-2xl font-bold hover:bg-stone-50 transition-all border border-stone-200 shadow-sm">
                  Voir les réalisations
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Section (Bento Grid) */}
        <section className="py-32 px-6 lg:px-12 bg-surface" id="portfolio">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div>
                <span className="text-kelen-green-600 font-black tracking-[0.3em] uppercase text-xs">Excellence & Savoir-faire</span>
                <h2 className="text-4xl md:text-5xl font-black mt-4 text-stone-900 tracking-tight">Portfolio de Projets</h2>
              </div>
              <p className="text-stone-500 max-w-sm font-medium italic text-lg leading-relaxed">
                Une sélection rigoureuse de réalisations témoignant d&apos;une précision technique et d&apos;un engagement envers la qualité.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {portfolioItems.length > 0 ? (
                <>
                  {/* Featured Project */}
                  <div className="md:col-span-8 group relative overflow-hidden rounded-[2.5rem] bg-white shadow-lg transition-all duration-500 hover:shadow-2xl">
                    <Link href={`/professionnels/${slug}/realisations/${portfolioItems[0].id}`}>
                      <img 
                        className="w-full h-[600px] object-cover transition-transform duration-700 group-hover:scale-110" 
                        src={portfolioItems[0].image} 
                        alt={portfolioItems[0].title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-12">
                        <h3 className="text-white text-3xl font-black mb-2">{portfolioItems[0].title}</h3>
                        <p className="text-white/80 font-medium text-lg">{portfolioItems[0].location || 'Réalisation majeure'}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Grid Items */}
                  <div className="md:col-span-4 grid grid-rows-2 gap-8">
                    {portfolioItems.slice(1, 3).map((item) => (
                      <div key={item.id} className="group relative overflow-hidden rounded-[2.5rem] bg-stone-100 shadow-lg transition-all duration-500 hover:shadow-2xl">
                        <Link href={`/professionnels/${slug}/realisations/${item.id}`}>
                          <img 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            src={item.image} 
                            alt={item.title}
                          />
                          <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-8 text-center">
                            <div className="text-white">
                              <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                              <p className="text-sm font-bold uppercase tracking-widest text-white/70">Détails du projet</p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                    {portfolioItems.length === 1 && (
                       <div className="bg-stone-50 rounded-[2.5rem] border-4 border-dashed border-stone-100 flex items-center justify-center p-12 text-center row-span-2">
                          <p className="text-stone-300 font-black uppercase tracking-widest text-xs">Plus de projets à venir</p>
                       </div>
                    )}
                    {portfolioItems.length === 2 && (
                       <div className="bg-stone-50 rounded-[2.5rem] border-4 border-dashed border-stone-100 flex items-center justify-center p-12 text-center">
                          <p className="text-stone-300 font-black uppercase tracking-widest text-xs">Plus de projets à venir</p>
                       </div>
                    )}
                  </div>
                </>
              ) : (
                // Fallback to placeholders if no real realizations
                <>
                  {/* Featured Project Placeholder */}
                  <div className="md:col-span-8 group relative overflow-hidden rounded-[2.5rem] bg-white shadow-lg transition-all duration-500 hover:shadow-2xl">
                    <img 
                      className="w-full h-[600px] object-cover transition-transform duration-700 group-hover:scale-110" 
                      src={pro.portfolio_photos?.[1] || "https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&q=80"} 
                      alt="Réalisation majeure"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-12">
                      <h3 className="text-white text-3xl font-black mb-2">Projet d&apos;Excellence</h3>
                      <p className="text-white/80 font-medium text-lg">Conception et réalisation intégrale - Haut de gamme</p>
                    </div>
                  </div>

                  {/* Grid Items Placeholder */}
                  <div className="md:col-span-4 grid grid-rows-2 gap-8">
                    {[2, 3].map((idx) => (
                      <div key={idx} className="group relative overflow-hidden rounded-[2.5rem] bg-stone-100 shadow-lg transition-all duration-500 hover:shadow-2xl">
                        <img 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          src={pro.portfolio_photos?.[idx] || `https://images.unsplash.com/photo-1600607687940-46764b36872a?auto=format&fit=crop&q=80&sig=${idx}`} 
                          alt={`Réalisation ${idx}`}
                        />
                        <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-8 text-center">
                          <div className="text-white">
                            <h3 className="text-2xl font-black mb-2">Réalisation {idx}</h3>
                            <p className="text-sm font-bold uppercase tracking-widest text-white/70">Expertise technique</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}


              {/* Secondary Grid */}
              <div className="md:col-span-4 group overflow-hidden rounded-[2.5rem] bg-white border border-stone-100 shadow-lg transition-all duration-500 hover:shadow-2xl">
                 <div className="p-10">
                    <h3 className="text-2xl font-black text-stone-900 mb-2">Projet Récents</h3>
                    <p className="text-stone-500 font-medium">Bénéficiez d&apos;une expertise reconnue sur le terrain.</p>
                 </div>
                 <img 
                   className="w-full h-64 object-cover" 
                   src={pro.portfolio_photos?.[4] || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80"} 
                   alt="Dernières réalisations"
                 />
              </div>

              <div className="md:col-span-4 group overflow-hidden rounded-[2.5rem] bg-white border border-stone-100 shadow-lg transition-all duration-500 hover:shadow-2xl">
                 <div className="p-10">
                    <h3 className="text-2xl font-black text-stone-900 mb-2">Engagements</h3>
                    <p className="text-stone-500 font-medium">Qualité, délais et transparence garantis par contrat.</p>
                 </div>
                 <img 
                   className="w-full h-64 object-cover" 
                   src={pro.portfolio_photos?.[5] || "https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80"} 
                   alt="Qualité d'exécution"
                 />
              </div>

              <div className="md:col-span-4 group overflow-hidden rounded-[2.5rem] bg-stone-900 shadow-lg transition-all duration-500 hover:shadow-2xl flex flex-col justify-center items-center p-12 text-center text-white">
                 <Award className="w-16 h-16 text-kelen-green-400 mb-6" />
                 <h3 className="text-3xl font-black mb-4">Certifié Kelen</h3>
                 <p className="text-white/60 font-medium mb-8">Ce professionnel a passé avec succès toutes les étapes de vérification de notre plateforme.</p>
                 <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all">
                   En savoir plus
                 </button>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-32 bg-stone-50" id="about">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-24 items-center">
              <div className="space-y-10">
                <div>
                  <span className="text-kelen-green-600 font-black tracking-[0.3em] uppercase text-xs">Notre Philosophie</span>
                  <h2 className="text-4xl md:text-5xl font-black mt-4 text-stone-900 tracking-tight leading-tight">Expertise & Engagement</h2>
                </div>
                
                <div className="space-y-8 text-xl text-stone-600 leading-relaxed font-medium">
                  <p>
                    Avec plus de {pro.years_experience || "10"} ans d&apos;expérience dans le secteur de {pro.category.toLowerCase()}, nous accompagnons nos clients dans la réalisation de projets complexes avec une rigueur absolue.
                  </p>
                  <p>
                    Notre approche repose sur trois piliers fondamentaux : l&apos;innovation technique, le respect scrupuleux des normes de sécurité et une écoute attentive des besoins spécifiques de chaque maître d&apos;ouvrage.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-12 border-t border-stone-200">
                  <div className="flex flex-col items-center text-center group">
                    <ShieldCheck className="w-10 h-10 text-stone-900 mb-4 transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Fiabilité</span>
                  </div>
                  <div className="flex flex-col items-center text-center group border-x border-stone-200 px-4">
                    <Compass className="w-10 h-10 text-stone-900 mb-4 transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Rigueur</span>
                  </div>
                  <div className="flex flex-col items-center text-center group">
                    <Calendar className="w-10 h-10 text-stone-900 mb-4 transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Délais</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-kelen-green-500/10 rounded-full blur-3xl z-0"></div>
                <img 
                  className="rounded-[3rem] w-full h-[700px] object-cover relative z-10 shadow-3xl grayscale hover:grayscale-0 transition-all duration-1000 ease-out" 
                  src={pro.portfolio_photos?.[6] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"} 
                  alt="L&apos;expert au travail"
                />
                <div className="absolute -bottom-10 -right-6 bg-white p-10 rounded-[2rem] shadow-2xl z-20 border border-stone-100 max-w-xs">
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
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-32 px-6 bg-white" id="contact">
          <div className="max-w-4xl mx-auto">
            <div className="bg-stone-50 rounded-[3rem] p-12 md:p-20 shadow-xl border border-stone-100 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-kelen-green-400 via-kelen-green-600 to-kelen-green-400"></div>
              
              <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-6 tracking-tight">Prêt à démarrer ?</h2>
              <p className="text-xl text-stone-500 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
                Prenez contact dès aujourd&apos;hui pour une étude personnalisée de votre projet avec {pro.business_name}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-left mb-16">
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-kelen-green-600">Informations Professionnelles</h4>
                  <div className="space-y-4">
                    <p className="text-3xl font-black text-stone-900 flex items-center gap-4">
                      {pro.owner_name || pro.business_name}
                      <Verified className="text-kelen-green-600 w-6 h-6" />
                    </p>
                    <p className="text-lg text-stone-600 font-bold">{pro.category}</p>
                    <p className="flex items-center gap-3 text-stone-500 font-medium">
                      <MapPin className="w-5 h-5" />
                      {pro.city}, {pro.country}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-kelen-green-600">Accès Direct</h4>
                  <div className="space-y-3">
                    <a className="flex items-center justify-between bg-white px-8 py-5 rounded-2xl hover:bg-stone-100 transition-all group shadow-sm border border-stone-100" href={`tel:${pro.phone}`}>
                      <span className="flex items-center gap-4 font-black text-stone-900">
                        <Phone className="w-5 h-5 text-stone-400 group-hover:text-stone-900" />
                        Appeler
                      </span>
                      <ChevronRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
                    </a>
                    {pro.whatsapp && (
                      <a className="flex items-center justify-between bg-kelen-green-600 text-white px-8 py-5 rounded-2xl hover:bg-kelen-green-700 transition-all group shadow-lg shadow-kelen-green-600/20" href={`https://wa.me/${pro.whatsapp.replace(/\+/g, '')}`}>
                        <span className="flex items-center gap-4 font-black">
                          <MessageCircle className="w-5 h-5 text-white/70" />
                          WhatsApp Business
                        </span>
                        <ChevronRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                    <a className="flex items-center justify-between border-2 border-stone-200 px-8 py-5 rounded-2xl hover:border-stone-900 transition-all group" href={`mailto:${pro.email}`}>
                      <span className="flex items-center gap-4 font-black text-stone-900">
                        <Mail className="w-5 h-5 text-stone-400 group-hover:text-stone-900" />
                        Envoyer un Email
                      </span>
                      <ChevronRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
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
