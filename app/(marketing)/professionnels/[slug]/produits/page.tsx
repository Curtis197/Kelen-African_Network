import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
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
    title: `Produits de ${pro.business_name} | Kelen`,
    description: `Découvrez tous les produits proposés par ${pro.business_name} sur Kelen.`,
  };
}

const availabilityConfig: Record<string, { label: string; classes: string }> = {
  available: { label: "Disponible", classes: "bg-green-100 text-green-700" },
  limited: { label: "Stock limité", classes: "bg-amber-100 text-amber-700" },
  out_of_stock: { label: "Rupture", classes: "bg-red-100 text-red-700" },
};

export default async function ProduitsListPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pro) notFound();

  const { data: products } = await supabase
    .from("professional_products")
    .select("*, product_images(*)")
    .eq("professional_id", pro.id)
    .eq("is_featured", true)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  const items = products || [];

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main className="pt-8">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
          <Link
            href={`/professionnels/${slug}#produits`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </Link>
          <div className="mb-8">
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">Notre boutique</span>
            <h1 className="font-headline font-bold text-4xl mt-2 text-on-surface">
              Produits de {pro.business_name}
            </h1>
          </div>
        </div>

        {/* Grid */}
        <section className="py-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((product) => {
                  const mainImage =
                    product.product_images?.find((img: any) => img.is_main) ||
                    product.product_images?.[0];
                  const avail =
                    availabilityConfig[product.availability] ||
                    availabilityConfig.available;
                  return (
                    <Link
                      key={product.id}
                      href={`/professionnels/${slug}/produits/${product.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl flex flex-col"
                    >
                      {mainImage ? (
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={mainImage.url}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {product.availability && (
                            <span
                              className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${avail.classes}`}
                            >
                              {avail.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative h-52 bg-stone-100 flex items-center justify-center">
                          <span className="text-stone-300 text-4xl">✦</span>
                          {product.availability && (
                            <span
                              className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${avail.classes}`}
                            >
                              {avail.label}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-xl font-black text-stone-900 mb-2 group-hover:text-kelen-green-600 transition-colors">
                          {product.title}
                        </h3>
                        {product.description && (
                          <p className="text-stone-500 text-sm line-clamp-2 mb-4 flex-grow">
                            {product.description}
                          </p>
                        )}
                        {product.price && (
                          <span className="font-bold text-kelen-green-600 text-base mt-auto">
                            {product.currency === "XOF"
                              ? `${
                                  product.price >= 1000000
                                    ? `${(product.price / 1000000).toFixed(1)}M`
                                    : product.price >= 1000
                                    ? `${(product.price / 1000).toFixed(0)}K`
                                    : product.price
                                } FCFA`
                              : product.currency === "EUR"
                              ? `${product.price.toLocaleString("fr-FR")} €`
                              : `$${product.price.toLocaleString("en-US")}`}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 bg-stone-50 rounded-3xl border-4 border-dashed border-stone-100">
                <p className="text-stone-400 font-black uppercase tracking-widest text-sm">
                  Aucun produit publié pour le moment
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
