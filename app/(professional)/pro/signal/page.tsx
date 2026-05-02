"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Reply, Send, AlignLeft, AlertTriangle, Info } from "lucide-react";

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

export default function ProSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseInput, setResponseInput] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (pro) {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .eq("professional_id", pro.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching signals:", error);
      } else {
        setSignals((data as Signal[]) || []);
      }
    }
    setIsLoading(false);
  };

  const submitResponse = async (id: string) => {
    const response = responseInput[id];
    if (!response?.trim()) return;

    setIsSubmitting(id);
    const { error } = await supabase
      .from("signals")
      .update({
        pro_response: response,
        pro_responded_at: new Date().toISOString(),
        status: "disputed" // Assuming responding disputes the signal
      })
      .eq("id", id);

    if (!error) {
      setSignals((prev) => 
        prev.map((s) => s.id === id ? { ...s, pro_response: response, status: "disputed" } : s)
      );
    }
    setIsSubmitting(null);
  };

  return (
    <main className="max-w-4xl">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 flex-shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Signalements & Litiges</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Gérez les incidents rapportés par vos clients et apportez votre version des faits.
          </p>
        </div>
      </header>

      <div className="mb-10 p-5 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4 items-start">
        <Info className="text-amber-600 text-2xl" />
        <div className="text-sm text-amber-900">
          <p className="font-bold mb-1">Droit de réponse (15 jours)</p>
          <p>Vous disposez d&apos;un délai légal de 15 jours pour répondre à tout signalement. Passé ce délai, le signalement peut être validé automatiquement par nos services.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-surface-container rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : signals.length > 0 ? (
        <div className="space-y-6">
          {signals.map((signal) => {
            const createdAt = new Date(signal.created_at);
            const deadline = new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000);
            const now = new Date();
            const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <article key={signal.id} className="bg-surface-container-low rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col">
                <div className="p-8 border-b border-border">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                        <AlertTriangle />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-on-surface">{BREACH_LABELS[signal.breach_type]}</h3>
                        <p className="text-xs text-on-surface-variant font-medium">Signalé le {createdAt.toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${SEVERITY_COLORS[signal.severity]}`}>
                        {signal.severity}
                      </span>
                      {!signal.pro_response && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {daysLeft}j restants
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-surface-container rounded-2xl p-5 mb-6 border border-border">
                    <p className="text-xs font-black text-on-surface-variant/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlignLeft className="text-sm" />
                      Détails de l&apos;incident
                    </p>
                    <p className="text-sm text-on-surface-variant leading-relaxed italic">
                      &quot;{signal.breach_description}&quot;
                    </p>
                  </div>

                  {!signal.pro_response ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <label className="block text-sm font-bold text-on-surface">
                        Votre réponse officielle
                      </label>
                      <textarea
                        value={responseInput[signal.id] || ""}
                        onChange={(e) => setResponseInput({ ...responseInput, [signal.id]: e.target.value })}
                        rows={4}
                        className="w-full rounded-2xl border border-border bg-surface-container px-5 py-4 text-sm focus:border-kelen-green-500 focus:bg-surface-container-low focus:outline-none focus:ring-4 focus:ring-kelen-green-500/5 transition-all"
                        placeholder="Apportez des éléments factuels pour répondre à ce signalement..."
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => submitResponse(signal.id)}
                          disabled={isSubmitting === signal.id || !responseInput[signal.id]?.trim()}
                          className="px-8 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmitting === signal.id ? (
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send className="text-lg" />
                          )}
                          Envoyer ma réponse
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-kelen-green-50/50 border border-kelen-green-100 rounded-2xl p-6">
                      <p className="text-xs font-black text-kelen-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Reply className="text-sm" />
                        Ma réponse publiée
                      </p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {signal.pro_response}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-surface-container-low rounded-3xl border border-border shadow-sm">
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-8">
            <Shield className="text-5xl text-on-surface-variant/40" />
          </div>
          <h3 className="text-2xl font-bold text-on-surface">Score de confiance impeccable</h3>
          <p className="text-on-surface-variant mt-2 max-w-sm text-center">
            Aucun signalement n&apos;a été enregistré sur votre profil. Continuez à offrir un service d&apos;excellence !
          </p>
        </div>
      )}
    </main>
  );
}
