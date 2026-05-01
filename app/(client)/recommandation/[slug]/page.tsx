import type { Metadata } from "next";
import Link from "next/link";
import { RecommendationForm } from "@/components/forms/RecommendationForm";
import { createClient } from "@/lib/supabase/server";

interface RecommendationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RecommendationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name")
    .eq("slug", slug)
    .single();

  return {
    title: pro
      ? `Recommander ${pro.business_name} — Kelen`
      : "Professionnel non trouvé — Kelen",
  };
}

export default async function RecommendationPage({
  params,
}: RecommendationPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, category, city, country, slug")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center px-4">
        <h1 className="text-2xl font-bold text-foreground">
          Professionnel non trouvé
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ce professionnel n&apos;est pas référencé sur Kelen.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-kelen-green-600 hover:text-kelen-green-700"
        >
          ← Retour à la recherche
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/pro/${pro.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        ← Retour au profil
      </Link>

      <div className="mt-4 mb-6 rounded-xl border border-border bg-white p-4">
        <p className="text-sm text-muted-foreground">Recommandation pour</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {pro.business_name}
        </p>
        <p className="text-sm text-muted-foreground">
          {pro.category} · {pro.city}, {pro.country}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <RecommendationForm
          professionalId={pro.id}
          professionalName={pro.business_name}
          professionalSlug={pro.slug}
        />
      </div>
    </div>
  );
}
