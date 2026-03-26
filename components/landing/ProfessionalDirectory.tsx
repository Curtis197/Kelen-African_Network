"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, Filter, Star, CheckCircle2, ChevronDown, Inbox } from "lucide-react";
import { Professional } from "@/lib/supabase/types";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";

interface ProfessionalDirectoryProps {
  initialPros: Professional[];
  totalCount: number;
}

export function ProfessionalDirectory({ initialPros, totalCount }: ProfessionalDirectoryProps) {
  const [category, setCategory] = useState("Toutes les spécialités");
  const [tier, setTier] = useState("Tous");
  const [locationQuery, setLocationQuery] = useState("");

  const filteredPros = useMemo(() => {
    return initialPros.filter((pro) => {
      // Category filter
      const matchesCategory = category === "Toutes les spécialités" || pro.category === category;
      
      // Tier filter
      const matchesTier = tier === "Tous" || 
        (tier === "Argent" && pro.status === "silver") || 
        (tier === "Or" && pro.status === "gold");
      
      // Location filter
      const searchStr = locationQuery.toLowerCase().trim();
      const matchesLocation = !searchStr || 
        pro.city.toLowerCase().includes(searchStr) || 
        pro.country.toLowerCase().includes(searchStr);
      
      return matchesCategory && matchesTier && matchesLocation;
    });
  }, [initialPros, category, tier, locationQuery]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 bg-surface">
      {/* Header */}
      <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl lg:text-6xl font-display">
            Trouvez votre expert de confiance
          </h1>
          <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
            Parcourez notre réseau de professionnels qualifiés pour accompagner vos projets au pays. 
            Vérifiés, transparents, et engagés.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-surface-container-low px-5 py-2.5 text-sm font-bold text-kelen-green-700">
          <span className="flex h-2 w-2 rounded-full bg-kelen-green-500" />
          <span>{filteredPros.length.toLocaleString()} expert{filteredPros.length > 1 ? "s" : ""} vérifié{filteredPros.length > 1 ? "s" : ""} trouvé{filteredPros.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="mb-16 rounded-3xl bg-surface-container-low p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Spécialité
            </label>
            <div className="relative group">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-2xl border-none bg-surface-container-lowest p-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-kelen-green-500"
              >
                <option>Toutes les spécialités</option>
                <option>Construction & Immobilier</option>
                <option>Conseil Juridique</option>
                <option>Technologie & IT</option>
                <option>Agriculture</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Localisation
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-kelen-green-500" />
              <input
                type="text"
                placeholder="Abidjan, Dakar..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full rounded-2xl border-none bg-surface-container-lowest py-4 pl-11 pr-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-kelen-green-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Niveau d&apos;excellence
            </label>
            <div className="flex gap-1 p-1 bg-surface-container-lowest rounded-2xl shadow-sm">
              {[ "Argent", "Or", "Tous"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`flex-1 rounded-xl py-3 text-[11px] font-black uppercase tracking-tighter transition-all ${
                    tier === t
                      ? "bg-kelen-green-600 text-white"
                      : "text-muted-foreground hover:bg-surface-container-low"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kelen-green-600 py-4 font-black text-white shadow-lg shadow-kelen-green-600/20 transition-all hover:bg-kelen-green-700 hover:shadow-xl active:scale-95">
              <Filter className="h-5 w-5" />
              <span>Affiner la recherche</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expert Grid */}
      {filteredPros.length > 0 ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPros.map((pro) => (
            <ProfessionalCard 
              key={pro.slug} 
              slug={pro.slug}
              businessName={pro.business_name}
              ownerName={pro.owner_name}
              category={pro.category}
              city={pro.city}
              country={pro.country}
              status={pro.status}
              recommendationCount={pro.recommendation_count}
              signalCount={pro.signal_count}
              avgRating={pro.avg_rating}
              reviewCount={pro.review_count}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 rounded-full bg-surface-container-low p-6">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-bold text-on-surface">Aucun expert trouvé</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            Essayez de modifier vos filtres ou de rechercher une autre ville pour trouver le professionnel qu&apos;il vous faut.
          </p>
          <button 
            onClick={() => {
              setCategory("Toutes les spécialités");
              setTier("Tous");
              setLocationQuery("");
            }}
            className="mt-8 text-sm font-black uppercase tracking-widest text-kelen-green-600 hover:text-kelen-green-700"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Pagination / Load More */}
      <div className="mt-20 flex flex-col items-center gap-6">
        <button className="flex items-center gap-3 rounded-[1.5rem] bg-white px-10 py-5 font-black text-foreground shadow-lg shadow-black/5 ring-1 ring-border transition-all hover:bg-kelen-green-50 hover:text-kelen-green-700 hover:ring-kelen-green-200 active:scale-95">
          <span>Voir plus d&apos;experts qualifiés</span>
          <ChevronDown className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <button className="h-12 w-12 rounded-full bg-kelen-green-600 text-sm font-black text-white shadow-md shadow-kelen-green-600/20">1</button>
          <button className="h-12 w-12 rounded-full text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">2</button>
          <button className="h-12 w-12 rounded-full text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">3</button>
          <span className="px-4 text-muted-foreground font-black tracking-widest">...</span>
          <button className="h-12 w-12 rounded-full text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">12</button>
        </div>
      </div>
    </section>
  );
}
