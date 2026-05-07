// components/portfolio/DomainSearch.tsx
"use client";

import { useState, useTransition } from "react";
import { Search, Check, X, Loader2, Globe } from "lucide-react";
import { searchDomain, activateDomain } from "@/lib/actions/domain";

type DomainResult = {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
};

export function DomainSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setResults([]);
    startSearch(async () => {
      try {
        const data = await searchDomain(query.trim());
        setResults(data);
      } catch (e: any) {
        setError("Erreur lors de la recherche. Réessayez.");
      }
    });
  }

  async function handleActivate(domain: string) {
    setActivating(domain);
    setError(null);
    try {
      await activateDomain(domain);
      setActivated(domain);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'activation.");
    } finally {
      setActivating(null);
    }
  }

  if (activated) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-kelen-green-50 border border-kelen-green-200">
        <Globe className="w-5 h-5 text-kelen-green-600 shrink-0" />
        <div>
          <p className="font-bold text-sm text-kelen-green-800">
            {activated} — Activation en cours
          </p>
          <p className="text-xs text-kelen-green-600 mt-0.5">
            Votre site sera accessible dans quelques minutes le temps que le DNS se propage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="diallo-construction-abidjan"
          className="flex-1 px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="h-12 px-5 rounded-xl bg-kelen-green-600 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:bg-kelen-green-700 transition-colors"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Chercher
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(r => (
            <div
              key={r.domain}
              className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low"
            >
              <div className="flex items-center gap-3">
                {r.available ? (
                  <Check className="w-4 h-4 text-kelen-green-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-sm text-on-surface">{r.domain}</p>
                  {r.available && r.price && (
                    <p className="text-xs text-on-surface-variant/60">
                      {r.price} {r.currency ?? "USD"} / an
                    </p>
                  )}
                  {!r.available && (
                    <p className="text-xs text-red-400">Déjà pris</p>
                  )}
                </div>
              </div>

              {r.available && (
                <button
                  onClick={() => handleActivate(r.domain)}
                  disabled={activating === r.domain}
                  className="h-9 px-4 rounded-lg bg-kelen-green-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-kelen-green-700 transition-colors"
                >
                  {activating === r.domain && <Loader2 className="w-3 h-3 animate-spin" />}
                  Activer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
