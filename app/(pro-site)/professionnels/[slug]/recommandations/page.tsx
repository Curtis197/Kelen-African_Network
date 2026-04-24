import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProfessionalRecommandations } from "@/lib/actions/professional-recommandations";

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
    title: `Recommandations de ${pro.business_name} | Kelen`,
    description: `Découvrez les recommandations et témoignages de clients pour ${pro.business_name}.`,
  };
}

export default async function RecommandationsListPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pro) notFound();

  const recommandations = await getProfessionalRecommandations(pro.id);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main className="pt-16">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <Link 
              href={`/professionnels/${slug}#recommandations`}
              className="inline-flex items-center gap-2 text-stone-600 hover:text-kelen-green-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au profil
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
              Recommandations pour {pro.business_name}
            </h1>
            <p className="text-stone-500 mt-2 text-lg">
              {recommandations.length} recommandation{recommandations.length !== 1 ? 's' : ''} vérifiée{recommandations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* List */}
        <section className="py-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl mx-auto">
            {recommandations.length > 0 ? (
              <div className="space-y-6">
                {recommandations.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                  >
                    {/* Quote Icon */}
                    <div className="text-kelen-green-600 mb-4">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>

                    {/* Content */}
                    <p className="text-stone-600 text-base leading-relaxed mb-4">
                      {rec.content}
                    </p>

                    {/* Context */}
                    {rec.project_context && (
                      <p className="text-sm text-stone-400 mb-4 italic">
                        Contexte : {rec.project_context}
                      </p>
                    )}

                    {/* Anonymous Author */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-kelen-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-black text-kelen-green-600">A</span>
                        </div>
                        <span className="text-sm font-medium text-stone-500">Client vérifié</span>
                      </div>
                      <span className="text-sm text-stone-400">
                        {formatDate(rec.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-stone-50 rounded-3xl border-4 border-dashed border-stone-100">
                <p className="text-stone-400 font-black uppercase tracking-widest text-sm">
                  Aucune recommandation pour le moment
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
