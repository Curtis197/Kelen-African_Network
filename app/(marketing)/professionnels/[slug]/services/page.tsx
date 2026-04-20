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
    title: `Services de ${pro.business_name} | Kelen`,
    description: `Découvrez tous les services proposés par ${pro.business_name} sur Kelen.`,
  };
}

export default async function ServicesListPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pro) notFound();

  const { data: services } = await supabase
    .from("professional_services")
    .select("*, service_images(*)")
    .eq("professional_id", pro.id)
    .eq("is_featured", true)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  const items = services || [];

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main className="pt-8">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
          <Link
            href={`/professionnels/${slug}#services`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </Link>
          <div className="mb-8">
            <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">Ce que nous proposons</span>
            <h1 className="font-headline font-bold text-4xl mt-2 text-on-surface">
              Services de {pro.business_name}
            </h1>
          </div>
        </div>

        {/* Grid */}
        <section className="py-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((service) => {
                  const mainImage =
                    service.service_images?.find((img: any) => img.is_main) ||
                    service.service_images?.[0];
                  return (
                    <Link
                      key={service.id}
                      href={`/professionnels/${slug}/services/${service.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl flex flex-col"
                    >
                      {mainImage ? (
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={mainImage.url}
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="h-52 bg-stone-100 flex items-center justify-center">
                          <span className="text-stone-300 text-4xl">✦</span>
                        </div>
                      )}
                      <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-xl font-black text-stone-900 mb-2 group-hover:text-kelen-green-600 transition-colors">
                          {service.title}
                        </h3>
                        {service.description && (
                          <p className="text-stone-500 text-sm line-clamp-2 mb-4 flex-grow">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap mt-auto">
                          {service.price && (
                            <span className="font-bold text-kelen-green-600 text-base">
                              {service.currency === "XOF"
                                ? `${
                                    service.price >= 1000000
                                      ? `${(service.price / 1000000).toFixed(1)}M`
                                      : service.price >= 1000
                                      ? `${(service.price / 1000).toFixed(0)}K`
                                      : service.price
                                  } FCFA`
                                : service.currency === "EUR"
                                ? `${service.price.toLocaleString("fr-FR")} €`
                                : `$${service.price.toLocaleString("en-US")}`}
                            </span>
                          )}
                          {service.duration && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                              {service.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 bg-stone-50 rounded-3xl border-4 border-dashed border-stone-100">
                <p className="text-stone-400 font-black uppercase tracking-widest text-sm">
                  Aucun service publié pour le moment
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
