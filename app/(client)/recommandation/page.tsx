"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Professional {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  country: string;
  category: string;
}

export default function SelectProForRecommendationPage() {
  const [search, setSearch] = useState("");
  const [pros, setPros] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPros();
  }, [search]);

  const fetchPros = async () => {
    setIsLoading(true);
    let query = supabase
      .from("professionals")
      .select("id, slug, business_name, city, country, category")
      .eq("is_active", true)
      .limit(10);

    if (search.trim()) {
      query = query.or(`business_name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (!error) {
      setPros((data as Professional[]) || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Soumettre une recommandation
        </h1>
        <p className="mt-3 text-stone-500 font-medium">
          Aidez la communauté en recommandant un professionnel dont vous avez apprécié les services.
        </p>
      </header>

      {/* Search */}
      <div className="relative group mb-8">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-kelen-green-600 transition-colors">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou métier..."
          className="w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 py-4 text-sm font-medium transition-all focus:border-kelen-green-500 focus:outline-none focus:ring-4 focus:ring-kelen-green-500/5 shadow-sm"
        />
      </div>

      {/* Results */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
          ))
        ) : pros.length > 0 ? (
          pros.map((pro) => (
            <Link
              key={pro.slug}
              href={`/recommandation/${pro.slug}`}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:border-kelen-green-500 hover:shadow-md group"
            >
              <div>
                <p className="font-bold text-stone-900 group-hover:text-kelen-green-700 transition-colors">{pro.business_name || "Professionnel Kelen"}</p>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                  {pro.category} • {pro.city}, {pro.country}
                </p>
              </div>
              <div className="flex items-center gap-2 text-kelen-green-600 font-bold text-xs uppercase tracking-widest">
                Recommander
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-stone-50/50 rounded-3xl border-2 border-dashed border-stone-200">
            <span className="material-symbols-outlined text-4xl text-stone-200 mb-4">person_search</span>
            <p className="text-sm text-stone-400 font-medium italic">Aucun professionnel trouvé pour cette recherche.</p>
          </div>
        )}

        {/* External CTA */}
        <div className="mt-8 pt-8 border-t border-stone-100">
          <Link
            href="/recommandation/externe"
            className="flex items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50/30 p-6 transition-all hover:border-kelen-green-500 hover:bg-kelen-green-50/30 group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm group-hover:bg-kelen-green-500 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div>
              <p className="font-bold text-stone-900">Le professionnel n'est pas sur Kelen ?</p>
              <p className="text-sm text-stone-500 font-medium">
                Vous pouvez quand même le recommander en saisissant ses informations manuellement.
              </p>
            </div>
            <span className="material-symbols-outlined ml-auto text-stone-300 group-hover:text-kelen-green-500 transition-colors">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
