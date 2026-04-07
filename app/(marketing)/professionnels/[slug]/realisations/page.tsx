import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PriceDisplay from "@/components/projects/PriceDisplay";

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
    title: `Réalisations de ${pro.business_name} | Kelen`,
    description: `Découvrez toutes les réalisations de ${pro.business_name} sur Kelen.`,
  };
}

export default async function RealisationsListPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pro) notFound();

  // Fetch realizations with their images
  const { data: realizations } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*)
    `)
    .eq("professional_id", pro.id)
    .order("created_at", { ascending: false });

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

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main className="pt-16">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <Link 
              href={`/professionnels/${slug}#portfolio`}
              className="inline-flex items-center gap-2 text-stone-600 hover:text-kelen-green-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au profil
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
              Toutes les réalisations de {pro.business_name}
            </h1>
            <p className="text-stone-500 mt-2 text-lg">
              {portfolioItems.length} réalisation{portfolioItems.length !== 1 ? 's' : ''} publiée{portfolioItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Grid */}
        <section className="py-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            {portfolioItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {portfolioItems.map((item) => (
                  <Link 
                    key={item.id}
                    href={`/professionnels/${slug}/realisations/${item.id}`}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl"
                  >
                    <img
                      className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-110"
                      src={item.image}
                      alt={item.title}
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-black text-stone-900 mb-2 group-hover:text-kelen-green-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-stone-500 text-sm line-clamp-2 mb-3">
                        {item.description}
                      </p>
                      {item.price && (
                        <PriceDisplay amount={item.price} currency={item.currency} />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-stone-50 rounded-3xl border-4 border-dashed border-stone-100">
                <p className="text-stone-400 font-black uppercase tracking-widest text-sm">
                  Aucune réalisation publiée pour le moment
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
