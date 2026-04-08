import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ChevronRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Mail,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import PriceDisplay from "@/components/projects/PriceDisplay";
import LikeButton from "@/components/interactions/LikeButton";
import RealizationCommentThread from "@/components/interactions/RealizationCommentThread";
import { getRealizationLikeStatus } from "@/lib/actions/realization-likes";
import { getRealizationComments } from "@/lib/actions/realization-comments";

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

  // Fetch like status and comments
  const likeStatus = await getRealizationLikeStatus(id);
  const comments = await getRealizationComments(id);

  return (
    <div className="bg-[#f9f9f8] font-body text-[#1a1c1c] antialiased min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-[#f9f9f8]/70 backdrop-blur-xl border-b border-[#bbcabf]/15 shadow-sm">
        <div className="flex items-center justify-between px-6 md:px-8 py-4 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="text-lg md:text-xl font-bold tracking-tighter text-[#1a1c1c]">Kelen</Link>
            <div className="hidden md:flex items-center gap-6 font-headline font-bold text-sm tracking-tight">
              <Link href="/discover" className="text-[#1a1c1c]/60 hover:text-[#10b77f] transition-all">Découvrir</Link>
              <Link href="/professionnels" className="text-[#1a1c1c]/60 hover:text-[#10b77f] transition-all">Experts</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-32 md:pb-20 max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Breadcrumb & Back */}
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#3c4a42]/60">
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

        {/* Hero Section */}
        <section className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-16 shadow-lg">
          <img
            src={mainImage}
            alt={realization.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20">
                {pro.category}
              </span>
              <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {realization.location || pro.city}
              </span>
            </div>
            <h1 className="font-headline font-extrabold text-7xl md:text-8xl text-white tracking-tighter leading-none max-w-4xl">
              {realization.title}
            </h1>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-16">
          {/* Left Column: Narrative & Gallery */}
          <div className="lg:col-span-7 space-y-16">
            {/* Like Button */}
            <div className="mb-12">
              <LikeButton
                realizationId={realization.id}
                initialLiked={likeStatus.liked}
                initialCount={likeStatus.count}
                size="lg"
              />
            </div>

            {/* Description */}
            <section>
              <h2 className="font-headline font-bold text-3xl mb-6 text-[#1a1c1c]">Vision & Exécution</h2>
              <div className="space-y-6 text-lg leading-relaxed text-[#3c4a42] max-w-3xl">
                <p>{realization.description}</p>
              </div>
            </section>

            {/* Gallery - Bento Grid */}
            {galleryImages.length > 0 && (
              <section className="grid grid-cols-2 gap-4 md:gap-6">
                {galleryImages.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden group aspect-[4/3] shadow-sm"
                  >
                    <img
                      src={img}
                      alt={`${realization.title} - image ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </section>
            )}

            {/* Comments Section */}
            <section className="mt-12 md:mt-16">
              <div className="flex items-end justify-between mb-8 md:mb-12">
                <div>
                  <h2 className="font-headline font-bold text-2xl md:text-4xl mb-2 md:mb-4 tracking-tight">Commentaires</h2>
                  <div className="h-1 w-16 md:w-20 bg-[#10b77f] rounded-full"></div>
                </div>
              </div>
              <RealizationCommentThread
                realizationId={realization.id}
                initialComments={comments}
              />
            </section>
          </div>

          {/* Right Column: Specs Card */}
          <div className="lg:col-span-3">
            <div className="sticky top-28 md:top-32 space-y-6 md:space-y-8">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#bbcabf]/10">
                <h3 className="font-headline font-bold text-xl mb-6 md:mb-8 border-b border-[#bbcabf]/15 pb-4">Spécifications</h3>
                <div className="space-y-5 md:space-y-6">
                  {/* Price Display */}
                  {realization.price && (
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-[#f3f4f3] p-2 md:p-3 rounded-lg">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-[#10b77f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-wider">Budget Projet</p>
                        <PriceDisplay amount={realization.price} currency={realization.currency || 'XOF'} className="text-lg md:text-xl" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="bg-[#f3f4f3] p-2 md:p-3 rounded-lg">
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#10b77f]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-wider">Localisation</p>
                      <p className="text-[#1a1c1c] font-semibold text-base md:text-lg">{realization.location || pro.city}</p>
                    </div>
                  </div>
                  {realization.completion_date && (
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-[#f3f4f3] p-2 md:p-3 rounded-lg">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#10b77f]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-wider">Date de réalisation</p>
                        <p className="text-[#1a1c1c] font-semibold text-base md:text-lg">
                          {new Date(realization.completion_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expert CTA Section */}
        <section className="mt-20 md:mt-32 relative">
          <div className="bg-[#2f3130] rounded-[2rem] p-8 md:p-16 overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12 relative">
            {/* Background Decorative Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-[#10b77f] rounded-full blur-[100px] -mr-32 md:-mr-48 -mt-32 md:-mt-48"></div>
            </div>
            
            <div className="relative z-10 w-28 h-28 md:w-40 md:h-40 flex-shrink-0">
              <img
                src={pro.profile_picture_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"}
                alt={pro.owner_name}
                className="w-full h-full object-cover rounded-full border-4 border-[#10b77f] shadow-2xl"
              />
            </div>

            <div className="relative z-10 flex-grow text-center md:text-left">
              <h2 className="font-headline font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                Démarrer une réalisation comme celle-ci.
              </h2>
              <p className="text-base md:text-lg text-white/70 mb-6 md:mb-8 max-w-xl">
                L&apos;approche de {pro.business_name} vous intéresse ? Contactez-le directement pour discuter de votre projet et de votre vision.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
                <Link href={`mailto:${pro.email}`} className="bg-gradient-to-r from-[#006c49] to-[#10b77f] hover:opacity-90 transition-all text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold flex items-center gap-2 md:gap-3 shadow-lg active:scale-95">
                  <Mail className="w-4 h-4 md:w-5 md:h-5" />
                  Demander une consultation
                </Link>
                {pro.whatsapp && (
                  <Link href={`https://wa.me/${pro.whatsapp.replace(/\+/g, '')}`} className="bg-white/10 hover:bg-white/20 transition-all text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold flex items-center gap-2 md:gap-3 backdrop-blur-md active:scale-95">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                    WhatsApp
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white p-4 pb-6 md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <img
              alt={pro.owner_name}
              src={pro.profile_picture_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#10b77f]/20"
            />
          </div>
          <div className="flex-grow flex flex-col gap-1">
            <Link
              href={`mailto:${pro.email}`}
              className="bg-gradient-to-r from-[#006c49] to-[#10b77f] text-white py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-[#10b77f]/20 active:scale-95 transition-transform text-center"
            >
              Demander une consultation
            </Link>
            <div className="flex gap-2">
              {pro.whatsapp && (
                <Link href={`https://wa.me/${pro.whatsapp.replace(/\+/g, '')}`} className="flex-1 bg-[#f3f4f3] text-[#1a1c1c] py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#f3f4f3] border-t border-[#bbcabf]/10 py-12 md:py-20">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <span className="text-xl font-bold tracking-tighter text-[#1a1c1c]">Kelen</span>
            <p className="text-xs text-[#3c4a42] font-medium tracking-wide">
              © 2026 KELEN DIASPORA. TOUS DROITS RÉSERVÉS.
            </p>
          </div>
          <div className="flex items-center gap-6 md:gap-8 text-xs md:text-[10px] font-bold text-[#3c4a42] uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-[#10b77f] transition-colors">Confidentialité</Link>
            <Link href="/terms" className="hover:text-[#10b77f] transition-colors">Conditions</Link>
            <Link href="/contact" className="hover:text-[#10b77f] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
