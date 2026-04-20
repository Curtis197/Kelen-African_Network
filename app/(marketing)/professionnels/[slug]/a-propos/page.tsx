import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  ShieldCheck,
  Compass,
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
} from "lucide-react";
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
    .select("business_name")
    .eq("slug", slug)
    .single();

  if (!pro) return { title: "Professionnel non trouvé | Kelen" };

  return {
    title: `À propos de ${pro.business_name} | Kelen`,
    description: `Découvrez l'histoire et les valeurs de ${pro.business_name} sur Kelen.`,
  };
}

export default async function AProposPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pro) notFound();

  const { data: portfolio } = await supabase
    .from("professional_portfolio")
    .select("about_text, about_image_url, show_about_section")
    .eq("professional_id", pro.id)
    .single();

  // If about section is explicitly disabled, show 404
  if (portfolio?.show_about_section === false) notFound();

  const aboutText = portfolio?.about_text;
  const aboutImage = portfolio?.about_image_url;

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main className="pt-8">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
          <Link
            href={`/professionnels/${slug}#about`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </Link>
        </div>

        {/* Hero Title */}
        <section className="py-16 px-4 sm:px-6 md:px-8 bg-surface">
          <div className="max-w-5xl mx-auto">
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">
              Notre Philosophie
            </span>
            <h1 className="font-headline font-extrabold text-5xl md:text-7xl mt-3 text-on-surface tracking-tighter leading-none">
              À propos de {pro.business_name}
            </h1>
          </div>
        </section>

        {/* About Content */}
        {aboutText && (
          <section className="py-16 px-4 sm:px-6 md:px-8 bg-surface-container-low">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-16 items-start">
                {/* Text */}
                <div className="space-y-6 text-lg text-on-surface-variant leading-relaxed">
                  <p className="whitespace-pre-wrap">{aboutText}</p>
                </div>

                {/* Image */}
                {aboutImage && (
                  <div className="relative">
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full z-0"></div>
                    <img
                      className="rounded-2xl w-full h-[500px] object-cover relative z-10 shadow-2xl"
                      src={aboutImage}
                      alt={`${pro.business_name} - à propos`}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Full-width about image (if no text column to pair with) */}
        {!aboutText && aboutImage && (
          <section className="px-4 sm:px-6 md:px-8 pb-16">
            <div className="max-w-5xl mx-auto">
              <img
                className="rounded-2xl w-full object-cover shadow-2xl"
                src={aboutImage}
                alt={`${pro.business_name} - à propos`}
              />
            </div>
          </section>
        )}

        {/* Philosophy Pillars */}
        <section className="py-24 px-4 sm:px-6 md:px-8 bg-surface">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">
                Nos valeurs
              </span>
              <h2 className="font-headline font-bold text-4xl mt-2 text-on-surface">
                Ce qui nous guide
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center p-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <div className="bg-primary/10 p-5 rounded-full mb-6">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface mb-3">
                  Fiabilité
                </h3>
                <p className="text-on-surface-variant font-body leading-relaxed text-sm">
                  Un engagement constant envers la qualité et la confiance que
                  nos clients nous accordent.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <div className="bg-primary/10 p-5 rounded-full mb-6">
                  <Compass className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface mb-3">
                  Rigueur
                </h3>
                <p className="text-on-surface-variant font-body leading-relaxed text-sm">
                  Un soin particulier apporté à chaque détail pour garantir des
                  prestations de la plus haute qualité.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-8 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <div className="bg-primary/10 p-5 rounded-full mb-6">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface mb-3">
                  Délais
                </h3>
                <p className="text-on-surface-variant font-body leading-relaxed text-sm">
                  Le respect des délais convenus est au cœur de notre façon de
                  travailler avec chaque client.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 md:px-8 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface-container-lowest rounded-2xl p-10 md:p-16 shadow-xl border border-outline-variant/10 text-center">
              <h2 className="font-headline font-bold text-3xl text-on-surface mb-2">
                Prêt à collaborer ?
              </h2>
              <p className="text-on-surface-variant font-medium mb-12">
                Contactez {pro.business_name} pour discuter de votre projet.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-12">
                {/* Left: Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">
                    Informations
                  </h4>
                  <div className="space-y-2">
                    <p className="text-2xl font-headline font-bold text-on-surface">
                      {pro.owner_name || pro.business_name}
                    </p>
                    <p className="text-lg text-on-surface-variant">{pro.category}</p>
                    <p className="flex items-center gap-2 text-on-surface-variant">
                      <MapPin className="w-4 h-4" />
                      {pro.city}
                      {pro.country ? `, ${pro.country}` : ""}
                    </p>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="space-y-4 flex flex-col justify-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">
                    Action Directe
                  </h4>
                  <div className="flex flex-col gap-3">
                    <a
                      className="flex items-center justify-between bg-surface-container-high px-6 py-4 rounded-lg hover:bg-surface-container-highest transition-colors group"
                      href={`tel:${pro.phone}`}
                    >
                      <span className="flex items-center gap-3 font-bold">
                        <Phone className="w-5 h-5" />
                        Appeler
                      </span>
                    </a>
                    {pro.whatsapp && (
                      <a
                        className="flex items-center justify-between bg-primary-container text-on-primary-container px-6 py-4 rounded-lg hover:opacity-90 transition-opacity group"
                        href={`https://wa.me/${pro.whatsapp.replace(/\+/g, "")}`}
                      >
                        <span className="flex items-center gap-3 font-bold">
                          <MessageCircle className="w-5 h-5" />
                          WhatsApp
                        </span>
                      </a>
                    )}
                    <a
                      className="flex items-center justify-between border-2 border-outline-variant/30 px-6 py-4 rounded-lg hover:border-primary transition-colors group"
                      href={`mailto:${pro.email}`}
                    >
                      <span className="flex items-center gap-3 font-bold">
                        <Mail className="w-5 h-5" />
                        Email
                      </span>
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
              <Link
                href="/privacy"
                className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              >
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
