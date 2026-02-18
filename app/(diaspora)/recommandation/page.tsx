import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Soumettre une recommandation — Kelen",
  description: "Sélectionnez le professionnel que vous souhaitez recommander.",
};

// Demo data — replaced by Supabase search
const DEMO_PROS = [
  {
    slug: "kouadio-construction-abidjan",
    business_name: "Kouadio Construction",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    category: "Construction",
  },
  {
    slug: "bamba-electricite-dakar",
    business_name: "Bamba Électricité",
    city: "Dakar",
    country: "Sénégal",
    category: "Électricité",
  },
];

export default function SelectProForRecommendationPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">
        Soumettre une recommandation
      </h1>
      <p className="mt-2 text-muted-foreground">
        Sélectionnez le professionnel que vous souhaitez recommander.
      </p>

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Rechercher un professionnel..."
          className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
        />
      </div>

      {/* Results */}
      <div className="mt-4 space-y-2">
        {DEMO_PROS.map((pro) => (
          <Link
            key={pro.slug}
            href={`/recommandation/${pro.slug}`}
            className="flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-colors hover:border-kelen-green-500/30"
          >
            <div>
              <p className="font-medium text-foreground">{pro.business_name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {pro.category} · {pro.city}, {pro.country}
              </p>
            </div>
            <span className="text-sm text-kelen-green-600">Recommander →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
