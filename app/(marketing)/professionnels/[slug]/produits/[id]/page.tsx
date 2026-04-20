import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("professional_products")
    .select("title, description")
    .eq("id", id)
    .single();

  if (!product) return { title: "Produit non trouvé | Kelen" };

  return {
    title: `${product.title} | Produit Kelen`,
    description:
      product.description || "Consultez le détail de ce produit sur Kelen.",
  };
}

const availabilityConfig: Record<
  string,
  { label: string; badgeClasses: string }
> = {
  available: {
    label: "Disponible",
    badgeClasses: "bg-green-100 text-green-700",
  },
  limited: {
    label: "Stock limité",
    badgeClasses: "bg-amber-100 text-amber-700",
  },
  out_of_stock: {
    label: "Rupture de stock",
    badgeClasses: "bg-red-100 text-red-700",
  },
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("professional_products")
    .select(`
      *,
      professional:professionals(*),
      product_images(*)
    `)
    .eq("id", id)
    .single();

  if (!product) notFound();

  const pro = product.professional;

  // Images
  const allImages: any[] = product.product_images ?? [];
  const mainImageObj = allImages.find((img) => img.is_main) || allImages[0];
  const mainImage =
    mainImageObj?.url ||
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80";
  const galleryImages = allImages
    .filter((img) => img.id !== mainImageObj?.id)
    .map((img) => img.url);

  const formatPrice = (amount: number, currency: string) => {
    if (currency === "XOF") {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M FCFA`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K FCFA`;
      return `${amount.toLocaleString("fr-FR")} FCFA`;
    }
    if (currency === "EUR") return `${amount.toLocaleString("fr-FR")} €`;
    if (currency === "USD") return `$${amount.toLocaleString("en-US")}`;
    return `${amount.toLocaleString()} ${currency}`;
  };

  const avail =
    availabilityConfig[product.availability] ||
    availabilityConfig.available;

  return (
    <div className="bg-[#f9f9f8] font-body text-[#1a1c1c] antialiased min-h-screen">
      <main className="pt-8 pb-32 md:pb-20 max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Back Button */}
        <div className="mb-8 md:mb-12 flex justify-end">
          <Link
            href={`/professionnels/${slug}/produits`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#f3f4f3] hover:bg-[#e8e8e7] text-[#1a1c1c] font-semibold text-sm rounded-full transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux produits
          </Link>
        </div>

        {/* Hero Section */}
        <section className="relative w-full h-[80vh] rounded-2xl overflow-hidden mb-16 shadow-lg">
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12">
            <div className="flex flex-wrap gap-3 mb-6">
              {product.category && (
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20">
                  {product.category}
                </span>
              )}
              {product.availability && (
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20">
                  {avail.label}
                </span>
              )}
            </div>
            <h1 className="font-headline font-extrabold text-7xl md:text-8xl text-white tracking-tighter leading-none max-w-4xl">
              {product.title}
            </h1>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-16">
          {/* Left Column: Description & Gallery */}
          <div className="lg:col-span-7 space-y-16">
            {/* Description */}
            {product.description && (
              <section>
                <div className="space-y-6 text-lg leading-relaxed text-[#3c4a42] max-w-3xl">
                  <p>{product.description}</p>
                </div>
              </section>
            )}

            {/* Gallery */}
            {galleryImages.length > 0 && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {galleryImages.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden group aspect-[4/3] shadow-sm"
                  >
                    <img
                      src={img}
                      alt={`${product.title} - image ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Right Column: Specs Card */}
          <div className="lg:col-span-3">
            <div className="sticky top-28 md:top-32 space-y-6 md:space-y-8">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#bbcabf]/10">
                <h3 className="font-headline font-bold text-xl mb-6 md:mb-8 border-b border-[#bbcabf]/15 pb-4">
                  Informations produit
                </h3>
                <div className="space-y-5 md:space-y-6">
                  {/* Price */}
                  {product.price && (
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-[#f3f4f3] p-2 md:p-3 rounded-lg">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 text-[#10b77f]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-wider">
                          Prix
                        </p>
                        <p className="text-[#1a1c1c] font-semibold text-base md:text-lg">
                          {formatPrice(product.price, product.currency || "XOF")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {product.availability && (
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-[#f3f4f3] p-2 md:p-3 rounded-lg">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 text-[#10b77f]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-wider">
                          Disponibilité
                        </p>
                        <span
                          className={`inline-block text-sm font-bold px-3 py-1 rounded-full mt-1 ${avail.badgeClasses}`}
                        >
                          {avail.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  {product.category && (
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-[#f3f4f3] p-2 md:p-3 rounded-lg">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 text-[#10b77f]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3c4a42] uppercase tracking-wider">
                          Catégorie
                        </p>
                        <p className="text-[#1a1c1c] font-semibold text-base md:text-lg">
                          {product.category}
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
                src={
                  pro.profile_picture_url ||
                  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"
                }
                alt={pro.owner_name}
                className="w-full h-full object-cover rounded-full border-4 border-[#10b77f] shadow-2xl"
              />
            </div>

            <div className="relative z-10 flex-grow text-center md:text-left">
              <h2 className="font-headline font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                Intéressé par ce produit ?
              </h2>
              <p className="text-base md:text-lg text-white/70 mb-6 md:mb-8 max-w-xl">
                Contactez {pro.business_name} directement pour commander ou
                obtenir plus d&apos;informations.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
                <Link
                  href={`mailto:${pro.email}`}
                  className="bg-gradient-to-r from-[#006c49] to-[#10b77f] hover:opacity-90 transition-all text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold flex items-center gap-2 md:gap-3 shadow-lg active:scale-95"
                >
                  <Mail className="w-4 h-4 md:w-5 md:h-5" />
                  Commander / Demander
                </Link>
                {pro.whatsapp && (
                  <Link
                    href={`https://wa.me/${pro.whatsapp.replace(/\+/g, "")}`}
                    className="bg-white/10 hover:bg-white/20 transition-all text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold flex items-center gap-2 md:gap-3 backdrop-blur-md active:scale-95"
                  >
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
              src={
                pro.profile_picture_url ||
                "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80"
              }
              className="w-12 h-12 rounded-full object-cover border-2 border-[#10b77f]/20"
            />
          </div>
          <div className="flex-grow flex flex-col gap-1">
            <Link
              href={`mailto:${pro.email}`}
              className="bg-gradient-to-r from-[#006c49] to-[#10b77f] text-white py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-[#10b77f]/20 active:scale-95 transition-transform text-center"
            >
              Commander / Demander
            </Link>
            <div className="flex gap-2">
              {pro.whatsapp && (
                <Link
                  href={`https://wa.me/${pro.whatsapp.replace(/\+/g, "")}`}
                  className="flex-1 bg-[#f3f4f3] text-[#1a1c1c] py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
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
            <span className="text-xl font-bold tracking-tighter text-[#1a1c1c]">
              Kelen
            </span>
            <p className="text-xs text-[#3c4a42] font-medium tracking-wide">
              © 2026 KELEN DIASPORA. TOUS DROITS RÉSERVÉS.
            </p>
          </div>
          <div className="flex items-center gap-6 md:gap-8 text-xs md:text-[10px] font-bold text-[#3c4a42] uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-[#10b77f] transition-colors">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-[#10b77f] transition-colors">
              Conditions
            </Link>
            <Link href="/contact" className="hover:text-[#10b77f] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
