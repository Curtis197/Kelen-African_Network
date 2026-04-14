"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Inbox, LayoutDashboard } from "lucide-react";
import { Professional } from "@/lib/supabase/types";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import type { ProfessionalArea, Profession } from "@/lib/types/taxonomy";
import { LocationSearch, type LocationData } from "@/components/location/LocationSearch";

interface ProfessionalDirectoryProps {
  initialPros: Professional[];
  totalCount: number;
  areas: ProfessionalArea[];
  allProfessions: Profession[];
  initialAreaId?: string;
  initialProfessionId?: string;
  initialProjectId?: string;
}

export function ProfessionalDirectory({
  initialPros,
  totalCount,
  areas,
  allProfessions,
  initialAreaId,
  initialProfessionId,
  initialProjectId,
}: ProfessionalDirectoryProps) {
  const router = useRouter();

  // Selection mode (coming from a project area)
  const projectId = initialProjectId;

  const [selectedAreaId, setSelectedAreaId] = useState(initialAreaId || "");
  const [selectedProfessionId, setSelectedProfessionId] = useState(initialProfessionId || "");
  const [tier, setTier] = useState("Tous");
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Professions filtered to the selected area
  const professionsForArea = useMemo(() => {
    if (!selectedAreaId) return [];
    return allProfessions.filter((p) => p.area_id === selectedAreaId);
  }, [allProfessions, selectedAreaId]);

  // Area name for selection mode banner
  const selectedAreaName = useMemo(
    () => areas.find((a) => a.id === selectedAreaId)?.name || "",
    [areas, selectedAreaId]
  );

  const filteredPros = useMemo(() => {
    return initialPros.filter((pro) => {
      const matchesArea = !selectedAreaId || pro.area_id === selectedAreaId;
      const matchesProfession = !selectedProfessionId || pro.profession_id === selectedProfessionId;
      const matchesTier = tier === "Tous" || (tier === "Or" && pro.status === "gold");
      const matchesLocation =
        !locationData ||
        pro.city.toLowerCase().includes(locationData.name.toLowerCase()) ||
        pro.country.toLowerCase().includes(locationData.name.toLowerCase()) ||
        pro.city.toLowerCase().includes((locationData.city || "").toLowerCase()) ||
        pro.country.toLowerCase().includes((locationData.country || "").toLowerCase());
      return matchesArea && matchesProfession && matchesTier && matchesLocation;
    });
  }, [initialPros, selectedAreaId, selectedProfessionId, tier, locationData]);

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    setSelectedProfessionId("");
  };

  const resetFilters = () => {
    setSelectedAreaId(initialAreaId || "");
    setSelectedProfessionId("");
    setTier("Tous");
    setLocationData(null);
  };

  console.log('[PRO_DIRECTORY] Component mounted:', {
    initialProsCount: initialPros.length,
    totalCount,
    filteredProsCount: filteredPros.length,
    hasMore: initialPros.length < totalCount,
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 bg-surface">
      {/* Selection Mode Banner */}
      {projectId && selectedAreaName && (
        <div className="mb-10 p-6 rounded-[2rem] bg-kelen-green-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-kelen-green-600/20 border border-white/10 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Mode Sélection de Professionnel</h3>
              <p className="text-white/80 font-medium">
                Ajout direct au domaine <span className="text-white font-bold underline underline-offset-4">{selectedAreaName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/projets/${projectId}`)}
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-widest transition-all"
          >
            ← Retour au projet
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl lg:text-6xl font-display">
            Trouvez le bon professionnel.
            <br />Construisez en confiance.
          </h1>
          <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
            Des professionnels avec un historique vérifié. Comparez leur travail,
            consultez leurs références, décidez sur des faits.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-surface-container-low px-5 py-2.5 text-sm font-bold text-kelen-green-700">
          <span className="flex h-2 w-2 rounded-full bg-kelen-green-500" />
          <span>
            {filteredPros.length.toLocaleString()} professionnel{filteredPros.length > 1 ? "s" : ""} vérifié{filteredPros.length > 1 ? "s" : ""} affiché{filteredPros.length > 1 ? "s" : ""}
            {initialPros.length < totalCount && (
              <span className="ml-1.5 text-xs opacity-75">
                (sur {totalCount.toLocaleString()})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-16 rounded-3xl bg-surface-container-low p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Area */}
          <div className="space-y-2">
            <label htmlFor="directory-area" className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Domaine
            </label>
            <div className="relative group">
              <select
                id="directory-area"
                value={selectedAreaId}
                onChange={(e) => handleAreaChange(e.target.value)}
                aria-label="Filtrer par domaine"
                className="w-full appearance-none rounded-2xl border-none bg-surface-container-lowest p-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-kelen-green-500"
              >
                <option value="">Tous les domaines</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Profession (cascading) */}
          <div className="space-y-2">
            <label htmlFor="directory-profession" className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Profession
            </label>
            <div className="relative group">
              <select
                id="directory-profession"
                value={selectedProfessionId}
                onChange={(e) => setSelectedProfessionId(e.target.value)}
                disabled={!selectedAreaId}
                aria-label="Filtrer par profession"
                className="w-full appearance-none rounded-2xl border-none bg-surface-container-lowest p-4 text-sm shadow-sm transition-all focus:ring-2 focus:ring-kelen-green-500 disabled:opacity-40"
              >
                <option value="">Toutes les professions</option>
                {professionsForArea.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label htmlFor="directory-location" className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Localisation
            </label>
            <LocationSearch
              value={locationData}
              onChange={setLocationData}
              placeholder="Abidjan, Dakar..."
              className="rounded-2xl border-none bg-surface-container-lowest shadow-sm"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Statut
            </label>
            <div className="flex gap-1 p-1 bg-surface-container-lowest rounded-2xl shadow-sm">
              {["Tous", "Or"].map((t) => (
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
        </div>
      </div>

      {/* Professional Grid */}
      {filteredPros.length > 0 ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPros.map((pro) => (
            <ProfessionalCard
              key={pro.slug}
              id={pro.id}
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
              profilePictureUrl={pro.portfolio_photos?.[0]}
              selectionContext={
                projectId && selectedAreaName
                  ? { projectId, areaName: selectedAreaName }
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 rounded-full bg-surface-container-low p-6">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-bold text-on-surface">Aucun professionnel trouvé</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            Essayez de modifier vos filtres ou de rechercher une autre ville pour trouver le professionnel qu&apos;il vous faut.
          </p>
          <button
            onClick={resetFilters}
            className="mt-8 text-sm font-black uppercase tracking-widest text-kelen-green-600 hover:text-kelen-green-700"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Pagination / Load More */}
      {filteredPros.length > 0 && (
        <div className="mt-20 flex flex-col items-center gap-6">
          {/* "Voir plus" button - only show if we haven't loaded all professionals */}
          {initialPros.length < totalCount && (
            <button
              className="flex items-center gap-3 rounded-[1.5rem] bg-surface-container-lowest px-6 md:px-10 py-4 md:py-5 font-black text-foreground shadow-lg shadow-black/5 ring-1 ring-border transition-all hover:bg-kelen-green-50 hover:text-kelen-green-700 hover:ring-kelen-green-200 active:scale-95 text-sm md:text-base"
              aria-label="Charger plus de professionnels"
              onClick={() => {
                // TODO: Implement load more functionality
                console.log('[PRO_DIRECTORY] Load more clicked - need to implement pagination');
              }}
            >
              <span>Voir plus de professionnels qualifiés</span>
              <ChevronDown className="h-5 w-5" />
            </button>
          )}

          {/* Pagination - only show if there are multiple pages */}
          {totalCount > initialPros.length && (
            <div className="flex items-center gap-2 md:gap-3" role="navigation" aria-label="Pagination">
              <span className="text-xs md:text-sm font-bold text-muted-foreground">
                Affichage de {initialPros.length} sur {totalCount} professionnels
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
