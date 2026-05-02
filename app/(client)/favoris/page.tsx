"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { UserSearch, MapPin, Heart, Search } from "lucide-react";

interface Favorite {
  id: string;
  professional_id: string;
  professionals: {
    id: string;
    business_name: string;
    category: string;
    city: string;
    country: string;
    slug: string;
    status: string;
    portfolio_photos: string[] | null;
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_favorites")
      .select("*, professionals(*)")
      .eq("user_id", user.id);

    if (!error) setFavorites((data as any[]) || []);
    setIsLoading(false);
  };

  const removeFavorite = async (id: string) => {
    const { error } = await supabase.from("user_favorites").delete().eq("id", id);
    if (!error) {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const filteredFavorites = favorites.filter((f) => {
    const pro = f.professionals;
    const term = search.toLowerCase();
    return (
      pro.business_name.toLowerCase().includes(term) ||
      pro.category.toLowerCase().includes(term)
    );
  });

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <nav className="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <span>Plateforme</span>
              <span className="text-stone-300">/</span>
              <span className="text-kelen-green-600">Favoris</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 tracking-tight mb-2">
              Professionnels sauvegardés
            </h1>
            <p className="text-stone-500 max-w-lg">
              Gérez votre réseau de confiance et suivez l&apos;avancement de vos collaborations prioritaires.
            </p>
          </div>

          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-kelen-green-600 transition-colors">
              <Search className="text-xl" />
            </div>
            <input
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-kelen-green-500/20 focus:bg-white transition-all placeholder:text-stone-400 text-sm"
              placeholder="Rechercher par nom ou métier..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFavorites.map((fav) => {
              const pro = fav.professionals;
              return (
                <article
                  key={fav.id}
                  className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200/50"
                >
                  <button
                    onClick={() => removeFavorite(fav.id)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-kelen-red-500 hover:scale-110 active:scale-95 transition-all shadow-sm border border-stone-100"
                    title="Retirer des favoris"
                  >
                    <Heart className="fill-current" />
                  </button>
                  <Link href={`/pro/${pro.slug}`} className="block">
                    <div className="relative mb-4 aspect-video rounded-xl overflow-hidden bg-stone-100">
                      <Image
                        alt={`Photo de profil de ${pro.business_name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        src={pro.portfolio_photos?.[0] || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80"}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          pro.status === 'gold' ? 'bg-amber-100 text-amber-700' : 
                          pro.status === 'silver' ? 'bg-slate-100 text-slate-700' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {pro.status === 'gold' ? 'Or Certifié' : pro.status === 'silver' ? 'Argent' : 'Vérifié'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-stone-900 leading-tight group-hover:text-kelen-green-600 transition-colors">
                          {pro.business_name}
                        </h3>
                        <p className="text-kelen-green-600 text-sm font-semibold">
                          {pro.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-stone-500 text-sm border-t border-stone-100 pt-4">
                        <MapPin className="text-base" />
                        <span>{pro.city}, {pro.country}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-48 h-48 mb-8 bg-stone-50 rounded-full flex items-center justify-center">
              <UserSearch className="text-7xl text-stone-300" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              {search ? "Aucun résultat trouvé" : "Aucun favori pour le moment"}
            </h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto">
              {search ? "Essayez d'autres mots-clés." : "Commencez par explorer nos professionnels certifiés pour bâtir votre équipe de projet."}
            </p>
            <Link
              className="px-8 py-3 bg-kelen-green-500 text-white rounded-xl font-bold shadow-lg shadow-kelen-green-500/20 hover:bg-kelen-green-600 transition-all active:scale-95"
              href="/"
            >
              Découvrir des professionnels
            </Link>
          </div>
        )}

        <section className="mt-20 p-8 bg-stone-50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-stone-200/50">
          <div className="flex flex-col gap-1">
            <h4 className="text-xl font-bold text-stone-900">Besoin d&apos;un expert spécifique ?</h4>
            <p className="text-stone-500">Notre réseau s&apos;agrandit chaque jour avec les meilleurs talents locaux.</p>
          </div>
          <Link
            href="/"
            className="whitespace-nowrap px-6 py-3 bg-white text-stone-700 font-bold rounded-xl shadow-sm hover:bg-stone-100 transition-all border border-stone-200"
          >
            Utiliser la recherche avancée
          </Link>
        </section>
      </div>
    </main>
  );
}
