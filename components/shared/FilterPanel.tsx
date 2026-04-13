"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, COUNTRIES } from "@/lib/utils/constants";

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") || "lookup";
  const category = searchParams.get("category") || "";
  const country = searchParams.get("country") || "";
  const statusFilter = searchParams.get("status") || "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/recherche?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border bg-muted p-1" role="group" aria-label="Mode de recherche">
        <button
          onClick={() => updateParam("mode", "lookup")}
          aria-pressed={mode === "lookup"}
          aria-label="Vérifier par nom"
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "lookup"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Vérifier (par nom)
        </button>
        <button
          onClick={() => updateParam("mode", "browse")}
          aria-pressed={mode === "browse"}
          aria-label="Trouver par catégorie"
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "browse"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Trouver (par catégorie)
        </button>
      </div>

      {/* Browse mode filters */}
      {mode === "browse" && (
        <>
          <label htmlFor="filter-category" className="sr-only">Catégorie</label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            aria-label="Filtrer par catégorie"
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-kelen-green-500 focus:outline-none"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <label htmlFor="filter-country" className="sr-only">Pays</label>
          <select
            id="filter-country"
            value={country}
            onChange={(e) => updateParam("country", e.target.value)}
            aria-label="Filtrer par pays"
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-kelen-green-500 focus:outline-none"
          >
            <option value="">Tous pays</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <label htmlFor="filter-status" className="sr-only">Statut</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => updateParam("status", e.target.value)}
            aria-label="Filtrer par statut"
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-kelen-green-500 focus:outline-none"
          >
            <option value="">Tous statuts</option>
            <option value="black">Liste noire uniquement</option>
            <option value="red,black">Liste noire et liste rouge</option>
          </select>
        </>
      )}
    </div>
  );
}
