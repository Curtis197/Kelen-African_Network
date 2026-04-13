"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, AlertTriangle, Star, Loader2, Check, Link as LinkIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  project_type: string;
  location: string;
  completion_date: string;
  status: "pending" | "verified" | "rejected";
  linked: boolean;
  submitter_name: string;
  created_at: string;
}

interface Signal {
  id: string;
  breach_type: "timeline" | "budget" | "quality" | "abandonment" | "fraud";
  severity: "minor" | "major" | "critical";
  breach_description: string;
  submitter_name: string;
  created_at: string;
  status: "pending" | "verified" | "rejected" | "disputed";
  pro_response: string | null;
  pro_responded_at: string | null;
}

type TabType = "recommendations" | "signals";

const BREACH_LABELS: Record<string, string> = {
  timeline: "Retard de livraison",
  budget: "Dépassement budgétaire",
  quality: "Défaut de qualité",
  abandonment: "Abandon de chantier",
  fraud: "Suspicion de fraude",
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: "bg-blue-100 text-blue-700",
  major: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const REC_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  verified: { label: "Vérifié", className: "bg-kelen-green-100 text-kelen-green-700" },
  rejected: { label: "Refusé", className: "bg-red-100 text-red-700" },
};

export function ValidationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("recommendations");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [responseInput, setResponseInput] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) { setIsLoading(false); return; }

    const [{ data: recs }, { data: sigs }] = await Promise.all([
      supabase.from("recommendations").select("*").eq("professional_id", pro.id).order("created_at", { ascending: false }),
      supabase.from("signals").select("*").eq("professional_id", pro.id).order("created_at", { ascending: false }),
    ]);

    setRecommendations((recs as Recommendation[]) || []);
    setSignals((sigs as Signal[]) || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const linkToProfile = async (id: string) => {
    setIsLinking(id);
    const { error } = await supabase
      .from("recommendations")
      .update({ linked: true, linked_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, linked: true } : r));
      toast.success("Recommandation liée au profil");
    }
    setIsLinking(null);
  };

  const submitResponse = async (id: string) => {
    const response = responseInput[id];
    if (!response?.trim()) { toast.error("Veuillez écrire une réponse"); return; }

    setIsSubmitting(id);
    const { error } = await supabase
      .from("signals")
      .update({ pro_response: response, pro_responded_at: new Date().toISOString(), status: "disputed" })
      .eq("id", id);
    if (!error) {
      setSignals(prev => prev.map(s => s.id === id ? { ...s, pro_response: response, status: "disputed" } : s));
      toast.success("Réponse envoyée");
    }
    setIsSubmitting(null);
  };

  const recCount = recommendations.length;
  const signalCount = signals.length;
  const pendingRecs = recommendations.filter(r => !r.linked).length;
  const pendingSignals = signals.filter(s => !s.pro_response && s.status !== "verified" && s.status !== "rejected").length;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-on-surface-variant" />
          <h1 className="text-2xl font-bold text-on-surface">Validation</h1>
        </div>
        <p className="text-sm text-on-surface-variant">
          Gérez vos recommandations et signalements. Liez les témoignages à votre profil et répondez aux signalements.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-8">
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "recommendations"
              ? "bg-white text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Star className="w-4 h-4" />
          Recommandations
          {pendingRecs > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-kelen-green-100 text-kelen-green-700 rounded-full">
              {pendingRecs}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("signals")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "signals"
              ? "bg-white text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Signalements
          {pendingSignals > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">
              {pendingSignals}
            </span>
          )}
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-on-surface-variant/40 animate-spin" />
        </div>
      ) : activeTab === "recommendations" ? (
        recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map(rec => {
              const statusConf = REC_STATUS_CONFIG[rec.status];
              return (
                <div key={rec.id} className="bg-surface-container-low rounded-2xl p-5 border border-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-bold text-on-surface">{rec.project_type}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConf.className}`}>
                          {statusConf.label}
                        </span>
                        {rec.linked && (
                          <span className="flex items-center gap-1 text-xs text-kelen-green-600 font-medium">
                            <Check className="w-3 h-3" /> Lié au profil
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant flex items-center gap-2">
                        <span>Client: {rec.submitter_name}</span>
                        <span className="text-on-surface-variant/30">·</span>
                        <span>{rec.location}</span>
                        <span className="text-on-surface-variant/30">·</span>
                        <span>{format(new Date(rec.completion_date), "d MMM yyyy", { locale: fr })}</span>
                      </p>
                    </div>

                    {!rec.linked && rec.status === "verified" && (
                      <button
                        onClick={() => linkToProfile(rec.id)}
                        disabled={isLinking === rec.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                      >
                        {isLinking === rec.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <LinkIcon className="w-3 h-3" />
                        )}
                        Lier au profil
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container rounded-3xl border-2 border-dashed border-border">
            <Star className="w-12 h-12 text-on-surface-variant/30 mb-4" />
            <h3 className="text-lg font-bold text-on-surface">Aucune recommandation</h3>
            <p className="text-sm text-on-surface-variant mt-2 text-center max-w-sm">
              Les recommandations vérifiées de vos clients apparaîtront ici.
            </p>
          </div>
        )
      ) : (
        signals.length > 0 ? (
          <div className="space-y-6">
            {/* Warning banner */}
            {pendingSignals > 0 && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-0.5">Réponse requise sous 15 jours</p>
                  <p>Vous disposez de 15 jours pour répondre à tout signalement. Passé ce délai, le signalement peut être validé automatiquement.</p>
                </div>
              </div>
            )}

            {signals.map(signal => {
              const createdAt = new Date(signal.created_at);
              const deadline = new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000);
              const now = new Date();
              const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <div key={signal.id} className="bg-surface-container-low rounded-2xl border border-border overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-on-surface">{BREACH_LABELS[signal.breach_type]}</h3>
                          <p className="text-xs text-on-surface-variant">Signalé le {format(createdAt, "d MMM yyyy", { locale: fr })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${SEVERITY_COLORS[signal.severity]}`}>
                          {signal.severity}
                        </span>
                        {!signal.pro_response && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {daysLeft}j restants
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-surface-container rounded-xl p-4 mb-4 border border-border">
                      <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        Détails
                      </p>
                      <p className="text-sm text-on-surface-variant italic leading-relaxed">
                        "{signal.breach_description}"
                      </p>
                    </div>

                    {/* Response */}
                    {signal.pro_response ? (
                      <div className="bg-kelen-green-50 rounded-xl p-4 border border-kelen-green-100">
                        <p className="text-xs font-bold text-kelen-green-600 uppercase tracking-wider mb-2">
                          Votre réponse
                        </p>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{signal.pro_response}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={responseInput[signal.id] || ""}
                          onChange={(e) => setResponseInput(prev => ({ ...prev, [signal.id]: e.target.value }))}
                          rows={3}
                          placeholder="Apportez des éléments factuels pour répondre à ce signalement..."
                          className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-kelen-green-500/20 focus:border-kelen-green-500 outline-none resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => submitResponse(signal.id)}
                            disabled={isSubmitting === signal.id || !responseInput[signal.id]?.trim()}
                            className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                          >
                            {isSubmitting === signal.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>Envoyer la réponse</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container rounded-3xl border-2 border-dashed border-border">
            <ShieldCheck className="w-12 h-12 text-on-surface-variant/30 mb-4" />
            <h3 className="text-lg font-bold text-on-surface">Aucun signalement</h3>
            <p className="text-sm text-on-surface-variant mt-2 text-center max-w-sm">
              Votre profil est propre. Aucun signalement n'a été enregistré.
            </p>
          </div>
        )
      )}
    </div>
  );
}
