"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Recommendation {
  id: string;
  submitter_name: string;
  project_type: string;
  location: string;
  completion_date: string;
  status: "pending" | "verified" | "rejected";
  linked: boolean;
}

const STATUS_MAP = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  verified: { label: "Vérifié", className: "bg-kelen-green-100 text-kelen-green-700 shadow-sm" },
  rejected: { label: "Refusé", className: "bg-red-100 text-red-700" },
};

export default function ProRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get Pro ID
    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (pro) {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("professional_id", pro.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recommendations:", error);
      } else {
        setRecommendations((data as Recommendation[]) || []);
      }
    }
    setIsLoading(false);
  };

  const linkToProfile = async (id: string) => {
    setIsLinking(id);
    const { error } = await supabase
      .from("recommendations")
      .update({
        linked: true,
        linked_at: new Date().toISOString()
      })
      .eq("id", id);

    if (!error) {
      setRecommendations((prev) => 
        prev.map((r) => r.id === id ? { ...r, linked: true } : r)
      );
    }
    setIsLinking(null);
  };

  return (
    <main className="max-w-4xl">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Recommandations reçues</h1>
        <p className="mt-2 text-stone-500 font-medium">
          Retrouvez ici tous les témoignages de clients satisfaits. Liez-les à votre profil pour renforcer votre visibilité.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-stone-100">
            {recommendations.map((rec) => (
              <article
                key={rec.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-8 py-6 hover:bg-stone-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-stone-900">
                      {rec.project_type}
                    </h3>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-500 text-sm font-medium">{rec.location}</span>
                  </div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                    Client: {rec.submitter_name} <span className="mx-1">·</span> Terminé le{" "}
                    {new Date(rec.completion_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span
                    className={`rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                      STATUS_MAP[rec.status].className
                    }`}
                  >
                    {STATUS_MAP[rec.status].label}
                  </span>
                  
                  {rec.linked ? (
                    <div className="flex items-center gap-2 text-kelen-green-600 px-4 py-1.5 bg-kelen-green-50 rounded-xl border border-kelen-green-200/50">
                      <span className="material-symbols-outlined text-sm font-black text-kelen-green-600">verified</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Publié</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => linkToProfile(rec.id)}
                      disabled={isLinking === rec.id}
                      className="whitespace-nowrap rounded-xl bg-stone-900 px-5 py-2.5 text-[10px] font-black text-white uppercase tracking-widest transition-all hover:bg-stone-800 disabled:opacity-50 active:scale-95 shadow-lg shadow-stone-900/10 flex items-center gap-2"
                    >
                      {isLinking === rec.id ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-base">link</span>
                      )}
                      Lier au profil
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner mb-6">
            <span className="material-symbols-outlined text-4xl text-stone-300">workspace_premium</span>
          </div>
          <h3 className="text-xl font-bold text-stone-900">Aucune recommandation</h3>
          <p className="text-stone-500 mt-2 max-w-sm text-center">
            Envoyez votre lien de recommandation à vos anciens clients pour commencer à bâtir votre réputation.
          </p>
          <button className="mt-8 px-8 py-3 bg-kelen-green-500 text-white font-bold rounded-xl shadow-lg shadow-kelen-green-500/20">
            Copier mon lien Pro
          </button>
        </div>
      )}
    </main>
  );
}
