import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ChevronRight,
  ArrowLeft,
  MapPin,
  Calendar,
  ShieldCheck,
  Download,
  FileText,
  Mail,
  MessageCircle,
  Clock
} from "lucide-react";
import Link from "next/link";
import PriceDisplay from "@/components/projects/PriceDisplay";

interface Props {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: realization } = await supabase
    .from("professional_realizations")
    .select("title, description, professional_id")
    .eq("id", id)
    .single();

  if (!realization) return { title: "Réalisation non trouvée | Kelen" };

  return {
    title: `${realization.title} | Réalisation Kelen`,
    description: realization.description || "Consultez le détail de cette réalisation sur Kelen.",
  };
}

export default async function RealizationDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: realization } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      professional:professionals(*),
      images:realization_images(*)
    `)
    .eq("id", id)
    .single();

  if (!realization) notFound();

  const pro = realization.professional;

  // Get main image (is_main=true) or first image
  const mainImageObj = realization.images?.find((img: any) => img.is_main) || realization.images?.[0];
  const mainImage = mainImageObj?.url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80";
  const galleryImages = realization.images ? realization.images.filter((img: any) => img.id !== mainImageObj?.id).map((img: any) => img.url) : [];

  return (
    <div className="bg-[#f9f9f8] font-sans text-[#1a1c1c] antialiased min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-[#f9f9f8]/70 backdrop-blur-xl border-b border-[#bbcabf]/15 shadow-sm">
        <div className="flex items-center justify-between px-8 py-4 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tighter text-[#1a1c1c]">Kelen</Link>
            <div className="hidden md:flex items-center gap-6 font-semibold text-sm tracking-tight text-[#1a1c1c]/60">
              <Link href="/discover" className="hover:text-[#10b77f] transition-all">Découvrir</Link>
              <Link href="/professionnels" className="hover:text-[#10b77f] transition-all">Experts</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-20 max-w-[1440px] mx-auto px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1a1c1c]/40">
            <Link href="/professionnels" className="hover:text-[#1a1c1c] transition-colors">Experts</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/professionnels/${slug}`} className="hover:text-[#1a1c1c] transition-colors">{pro.business_name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#1a1c1c]">{realization.title}</span>
          </div>
          <Link 
            href={`/professionnels/${slug}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#f3f4f3] hover:bg-[#e8e8e7] text-[#1a1c1c] font-semibold text-sm rounded-full transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Portfolio
          </Link>
        </div>

        <section className="relative w-full aspect-[21/9] rounded-[2rem] overflow-hidden mb-16 shadow-xl border border-white/20">
          <img
            src={mainImage}
            alt={realization.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-12">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20">
                {pro.category}
              </span>
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> {realization.location || pro.city}
              </span>
            </div>
            <h1 className="font-bold text-6xl md:text-8xl text-white tracking-tighter leading-none max-w-4xl drop-shadow-2xl">
              {realization.title}
            </h1>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-16">
          <div className="lg:col-span-7 space-y-16">
            <section>
              <h2 className="text-3xl font-black mb-8 text-[#1a1c1c] tracking-tight">Vision & Exécution</h2>
              <div className="space-y-6 text-xl leading-relaxed text-[#3c4a42] font-medium max-w-3xl border-l-4 border-[#10b77f] pl-8">
                <p>{realization.description}</p>
              </div>
            </section>

            {galleryImages.length > 0 && (
              <section className="grid grid-cols-2 md:grid-cols-4 auto-rows-[300px] gap-6">
                {galleryImages.map((img: string, i: number) => (
                  <div
                    key={i}
                    className={`${i === 0 ? 'col-span-2 row-span-2' : ''} rounded-2xl overflow-hidden group shadow-lg border border-white/20`}
                  >
                    <img
                      src={img}
                      alt={`${realization.title} - image ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-32 space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#10b77f]"></div>
                <h3 className="text-xl font-black mb-10 text-[#1a1c1c] border-b border-[#f3f4f3] pb-6 uppercase tracking-[0.1em]">Spécifications</h3>
                <div className="space-y-8">
                  {/* Price Display */}
                  {realization.price && (
                    <div className="flex items-start gap-4">
                      <div className="bg-[#10b77f]/10 p-3 rounded-2xl text-[#10b77f]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#1a1c1c]/40 uppercase tracking-[0.2em]">Budget Projet</p>
                        <PriceDisplay amount={realization.price} currency={realization.currency || 'XOF'} className="text-2xl" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f3f4f3] p-3 rounded-2xl text-[#10b77f]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#1a1c1c]/40 uppercase tracking-[0.2em]">Localisation</p>
                      <p className="text-[#1a1c1c] font-bold text-lg">{realization.location || pro.city}</p>
                    </div>
                  </div>
                  {realization.completion_date && (
                    <div className="flex items-start gap-4">
                      <div className="bg-[#f3f4f3] p-3 rounded-2xl text-[#10b77f]">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#1a1c1c]/40 uppercase tracking-[0.2em]">Date de réalisation</p>
                        <p className="text-[#1a1c1c] font-bold text-lg">
                          {new Date(realization.completion_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] overflow-hidden h-48 bg-[#e2e2e2] relative group cursor-pointer shadow-lg border border-white/20">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                <img 
                  alt="Terrain Map" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                  src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80"
                />
                <div className="absolute bottom-6 left-6 z-20">
                  <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1c1c] flex items-center gap-2 shadow-sm">
                    <MapPin className="w-3 h-3" /> Voir le Terrain
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-32">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#10b77f] font-black tracking-[0.3em] uppercase text-xs mb-4">Documentation Technique</p>
              <h2 className="text-4xl font-black text-[#1a1c1c] tracking-tight leading-tight">Le Technical Vault</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {document.contract_url ? (
              <div className="group bg-white p-8 rounded-[2rem] hover:shadow-2xl transition-all duration-500 border border-[#f3f4f3] border-transparent hover:border-[#10b77f]/20">
                <div className="flex justify-between items-start mb-12">
                  <div className="bg-[#f3f4f3] p-4 rounded-2xl text-[#10b77f] group-hover:bg-[#10b77f] group-hover:text-white transition-all">
                    <FileText className="w-8 h-8" />
                  </div>
                  <a href={document.contract_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-6 h-6 text-[#1a1c1c]/20 group-hover:text-[#10b77f] transition-colors" />
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#10b77f] uppercase tracking-[0.2em] mb-2">Contrat</p>
                  <h4 className="font-bold text-xl text-[#1a1c1c] tracking-tight">Contrat signé</h4>
                  <p className="text-sm text-[#3c4a42]/60 mt-3 font-semibold">PDF Document</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/50 p-8 rounded-[2rem] border-2 border-dashed border-[#bbcabf]/20 flex flex-col justify-center items-center text-center opacity-70">
                 <Clock className="w-10 h-10 text-[#bbcabf] mb-4" />
                 <p className="text-xs font-black uppercase tracking-widest text-[#bbcabf]">Aucun document lié</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-40">
          <div className="bg-[#1a1c1c] rounded-[3.5rem] p-12 md:p-24 overflow-hidden flex flex-col md:flex-row items-center gap-16 relative shadow-3xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#10b77f] rounded-full blur-[150px] -mr-64 -mt-64 opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10 w-40 h-40 md:w-64 md:h-64 flex-shrink-0">
              <img 
                src={pro.profile_picture_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"} 
                alt={pro.owner_name} 
                className="w-full h-full object-cover rounded-[2.5rem] border-4 border-[#10b77f] shadow-2xl scale-105"
              />
            </div>
            
            <div className="relative z-10 flex-grow text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                Une réalisation<br/>comme celle-ci ?
              </h2>
              <p className="text-xl text-white/60 mb-12 max-w-xl font-medium leading-relaxed">
                Vous appréciez l&apos;approche de {pro.business_name} ? Contactez directement l&apos;expert pour discuter de votre projet et de votre vision.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Link href={`mailto:${pro.email}`} className="bg-[#10b77f] hover:bg-[#10b77f]/90 transition-all text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-[#10b77f]/20 active:scale-95">
                  <Mail className="w-5 h-5" />
                  Demander une consultation
                </Link>
                {pro.whatsapp && (
                  <Link href={`https://wa.me/${pro.whatsapp.replace(/\+/g, '')}`} className="bg-white/10 hover:bg-white/20 transition-all text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 backdrop-blur-md border border-white/10 active:scale-95">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp Direct
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#f3f4f3] border-t border-[#bbcabf]/15 py-20 mt-40">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="space-y-4">
            <span className="text-2xl font-black tracking-tighter text-[#1a1c1c]">Kelen</span>
            <p className="text-[10px] text-[#1a1c1c]/40 font-black uppercase tracking-[0.3em]">
              © 2026 KELEN DIASPORA. TOUS DROITS RÉSERVÉS.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 text-[10px] font-black text-[#1a1c1c]/40 uppercase tracking-[0.3em]">
            <Link href="/privacy" className="hover:text-[#10b77f] transition-colors">Confidentialité</Link>
            <Link href="/terms" className="hover:text-[#10b77f] transition-colors">Conditions</Link>
            <Link href="/contact" className="hover:text-[#10b77f] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
