"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, AlertTriangle, Star, Loader2, Check, Link as LinkIcon, MessageSquare, Clock } from "lucide-react";
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

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  minor:    { label: "Mineur",   className: "bg-blue-100 text-blue-700" },
  major:    { label: "Majeur",   className: "bg-amber-100 text-amber-700" },
  critical: { label: "Critique", className: "bg-red-100 text-red-700" },
};

const REC_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:  { label: "En attente", className: "bg-amber-100 text-amber-700" },
  verified: { label: "Vérifié",    className: "bg-kelen-green-100 text-kelen-green-700" },
  rejected: { label: "Refusé",     className: "bg-red-100 text-red-700" },
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

  const recCount      = recommendations.length;
  const signalCount   = signals.length;
  const verifiedRecs  = recommendations.filter(r => r.status === "verified").length;
  const linkedRecs    = recommendations.filter(r => r.linked).length;
  const pendingRecs   = recommendations.filter(r => !r.linked && r.status === "verified").length;
  const pendingSignals = signals.filter(s => !s.pro_response && s.status !== "verified" && s.status !== "rejected").length;

  return (
    <div className="max-w-5xl">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-kelen-green-50 text-kelen-green-600 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Validation</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Gérez vos recommandations et répondez aux signalements
            </p>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────── */}
        {!isLoading && (recCount > 0 || signalCount > 0) && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Recommandations</p>
              <p className="text-2xl font-black text-on-surface">{recCount}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{verifiedRecs} vérifiée{verifiedRecs > 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Liées au profil</p>
              <p className="text-2xl font-black text-kelen-green-600">{linkedRecs}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">sur {verifiedRecs} vérifiée{verifiedRecs > 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Signalements</p>
              <p className="text-2xl font-black text-on-surface">{signalCount}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{signalCount === 0 ? "Profil propre" : `${pendingSignals} en attente`}</p>
            </div>
            <div className={`rounded-2xl border p-4 shadow-sm ${pendingSignals > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-white"}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">À traiter</p>
              <p className={`text-2xl font-black ${pendingSignals > 0 ? "text-amber-600" : "text-on-surface"}`}>{pendingRecs + pendingSignals}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{pendingRecs} rec · {pendingSignals} signalement{pendingSignals > 1 ? "s" : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-7">
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "recommendations"
              ? "bg-kelen-green-600 text-white shadow-sm shadow-kelen-green-600/20"
              : "bg-white border border-border text-on-surface-variant hover:border-kelen-green-300 hover:text-kelen-green-700"
          }`}
        >
          <Star className="w-4 h-4" />
          Recommandations
          {recCount > 0 && (
            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
              activeTab === "recommendations" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
            }`}>
              {recCount}
            </span>
          )}
          {pendingRecs > 0 && activeTab !== "recommendations" && (
            <span className="w-2 h-2 rounded-full bg-kelen-green-500 flex-shrink-0" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("signals")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "signals"
              ? "bg-red-600 text-white shadow-sm shadow-red-600/20"
              : "bg-white border border-border text-on-surface-variant hover:border-red-300 hover:text-red-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Signalements
          {signalCount > 0 && (
            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
              activeTab === "signals" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
            }`}>
              {signalCount}
            </span>
          )}
          {pendingSignals > 0 && activeTab !== "signals" && (
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-on-surface-variant/40 animate-spin" />
        </div>
      ) : activeTab === "recommendations" ? (
        recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map(rec => {
              const statusConf = REC_STATUS_CONFIG[rec.status];
              return (
                <div
                  key={rec.id}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-kelen-green-50 text-kelen-green-600">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-on-surface">{rec.project_type}</h3>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusConf.className}`}>
                            {statusConf.label}
                          </span>
                          {rec.linked && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-kelen-green-600 bg-kelen-green-50 px-2 py-0.5 rounded-full">
                              <Check className="w-2.5 h-2.5" /> Lié au profil
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-1">
                          <span className="font-medium text-on-surface">{rec.submitter_name}</span>
                          <span className="text-border">·</span>
                          <span>{rec.location}</span>
                          <span className="text-border">·</span>
                          <span>{format(new Date(rec.completion_date), "d MMM yyyy", { locale: fr })}</span>
                        </p>
                      </div>

                      {!rec.linked && rec.status === "verified" && (
                        <button
                          onClick={() => linkToProfile(rec.id)}
                          disabled={isLinking === rec.id}
                          className="flex items-center gap-2 px-4 py-2 bg-kelen-green-600 text-white rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border bg-white text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-kelen-green-50 mb-5">
              <Star className="w-8 h-8 text-kelen-green-400" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">Aucune recommandation</h3>
            <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
              Les recommandations vérifiées de vos clients apparaîtront ici et pourront être liées à votre profil public.
            </p>
          </div>
        )
      ) : (
        signals.length > 0 ? (
          <div className="space-y-4">
            {/* Warning banner */}
            {pendingSignals > 0 && (
              <div className="flex gap-3 items-start rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-0.5">Réponse requise sous 15 jours</p>
                  <p className="text-amber-800/80 text-xs leading-relaxed">
                    Vous disposez de 15 jours pour répondre à tout signalement. Passé ce délai, il peut être validé automatiquement.
                  </p>
                </div>
              </div>
            )}

            {signals.map(signal => {
              const createdAt = new Date(signal.created_at);
              const deadline = new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000);
              const now = new Date();
              const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
              const sevConf = SEVERITY_CONFIG[signal.severity];
              const isUrgent = daysLeft <= 3 && !signal.pro_response;

              return (
                <div
                  key={signal.id}
                  className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${isUrgent ? "border-red-200" : "border-border"}`}
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-on-surface">{BREACH_LABELS[signal.breach_type]}</h3>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Par <span className="font-medium text-on-surface">{signal.submitter_name}</span>
                            {" · "}
                            {format(createdAt, "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${sevConf.className}`}>
                          {sevConf.label}
                        </span>
                        {!signal.pro_response && (
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isUrgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {daysLeft}j restants
                          </span>
                        )}
                        {signal.pro_response && (
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-kelen-green-100 text-kelen-green-700">
                            Répondu
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="rounded-xl bg-surface-container border border-border p-4 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1.5 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> Détails du signalement
                      </p>
                      <p className="text-sm text-on-surface-variant italic leading-relaxed">
                        "{signal.breach_description}"
                      </p>
                    </div>

                    {/* Response */}
                    {signal.pro_response ? (
                      <div className="rounded-xl bg-kelen-green-50 border border-kelen-green-100 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-kelen-green-600 mb-1.5 flex items-center gap-1.5">
                          <Check className="w-3 h-3" /> Votre réponse
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
                          className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-kelen-green-500/20 focus:border-kelen-green-500 outline-none resize-none transition-colors"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => submitResponse(signal.id)}
                            disabled={isSubmitting === signal.id || !responseInput[signal.id]?.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50"
                          >
                            {isSubmitting === signal.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Envoyer la réponse"
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
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-border bg-white text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-kelen-green-50 mb-5">
              <ShieldCheck className="w-8 h-8 text-kelen-green-400" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">Profil sans signalement</h3>
            <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
              Votre profil est propre. Aucun signalement n'a été enregistré contre vous.
            </p>
          </div>
        )
      )}
    </div>
  );
}
