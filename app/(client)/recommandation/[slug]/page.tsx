import type { Metadata } from "next";
import Link from "next/link";
import { RecommendationForm } from "@/components/forms/RecommendationForm";

// Demo data — replaced by Supabase query on slug
const DEMO_PRO = {
  id: "demo-1",
  slug: "kouadio-construction-abidjan",
  business_name: "Kouadio Construction",
  category: "Construction",
  city: "Abidjan",
  country: "Côte d'Ivoire",
};

interface RecommendationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RecommendationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pro = slug === DEMO_PRO.slug ? DEMO_PRO : null;
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
  const pro = slug === DEMO_PRO.slug ? DEMO_PRO : null;

  if (!pro) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Professionnel non trouvé
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ce professionnel n&apos;est pas référencé sur Kelen.
        </p>
        <Link
          href="/recommandation"
          className="mt-4 inline-block text-sm text-kelen-green-600 hover:text-kelen-green-700"
        >
          ← Retour à la sélection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/recommandation"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour
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

      <div className="rounded-xl border border-border bg-white p-6">
        <RecommendationForm
          professionalId={pro.id}
          professionalName={pro.business_name}
        />
      </div>
    </div>
  );
}
