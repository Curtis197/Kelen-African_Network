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
      <div className="flex rounded-lg border border-border bg-muted p-1">
        <button
          onClick={() => updateParam("mode", "lookup")}
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
          <select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-kelen-green-500 focus:outline-none"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={country}
            onChange={(e) => updateParam("country", e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-kelen-green-500 focus:outline-none"
          >
            <option value="">Tous pays</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => updateParam("status", e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-kelen-green-500 focus:outline-none"
          >
            <option value="">Tous statuts</option>
            <option value="gold">Liste Or uniquement</option>
            <option value="gold,silver">Or et Argent</option>
          </select>
        </>
      )}
    </div>
  );
}
