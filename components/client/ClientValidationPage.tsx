"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Star, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type TabType = "my-validations" | "new-recommendation" | "new-signal";

interface Validation {
  id: string;
  type: "recommendation" | "signal";
  professional_name: string;
  project_type?: string;
  status: string;
  created_at: string;
}

export function ClientValidationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("my-validations");
  const [validations, setValidations] = useState<Validation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchValidations = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const [recsRes, sigsRes] = await Promise.all([
      supabase
        .from("recommendations")
        .select("id, professional_id, professional_slug, project_type, status, created_at")
        .eq("submitter_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("signals")
        .select("id, professional_id, professional_slug, breach_type, status, created_at")
        .eq("submitter_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const recs: Validation[] = (recsRes.data || []).map((r: any) => ({
      id: r.id,
      type: "recommendation" as const,
      professional_name: r.professional_slug || "Professionnel externe",
      project_type: r.project_type,
      status: r.status,
      created_at: r.created_at,
    }));

    const sigs: Validation[] = (sigsRes.data || []).map((s: any) => ({
      id: s.id,
      type: "signal" as const,
      professional_name: s.professional_slug || "Professionnel externe",
      project_type: s.breach_type,
      status: s.status,
      created_at: s.created_at,
    }));

    setValidations([...recs, ...sigs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchValidations(); }, [fetchValidations]);

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "En attente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    verified: { label: "Vérifié", className: "bg-kelen-green-100 text-kelen-green-700 dark:bg-kelen-green-900/30 dark:text-kelen-green-400" },
    rejected: { label: "Refusé", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    disputed: { label: "Contesté", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-on-surface-variant" />
          <h1 className="text-2xl font-bold text-on-surface">Validation</h1>
        </div>
        <p className="text-sm text-on-surface-variant">
          Recommandez un professionnel que vous avez engagé ou signalez un manquement.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-container-low dark:bg-surface-container-low rounded-xl p-1 mb-8">
        <button
          onClick={() => setActiveTab("my-validations")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "my-validations"
              ? "bg-white dark:bg-surface-container-high text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Mes validations
          {validations.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-surface-container text-on-surface-variant rounded-full">
              {validations.length}
            </span>
          )}
        </button>
        <Link
          href="/recommandation"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <Star className="w-4 h-4" />
          Recommander
        </Link>
        <Link
          href="/signal"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Signaler
        </Link>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-on-surface-variant/40 animate-spin" />
        </div>
      ) : validations.length > 0 ? (
        <div className="space-y-4">
          {validations.map(v => {
            const conf = statusConfig[v.status] || { label: v.status, className: "bg-surface-container text-on-surface-variant" };
            return (
              <div key={`${v.type}-${v.id}`} className="bg-surface-container-low dark:bg-surface-container-low rounded-2xl p-5 border border-border">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    v.type === "recommendation"
                      ? "bg-kelen-green-50 dark:bg-kelen-green-900/20 text-kelen-green-600 dark:text-kelen-green-400"
                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  }`}>
                    {v.type === "recommendation" ? <Star className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-on-surface">
                        {v.type === "recommendation" ? "Recommandation" : "Signalement"}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conf.className}`}>
                        {conf.label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {v.type === "recommendation" ? `Projet: ${v.project_type || "—"}` : `Type: ${v.project_type || "—"}`}
                      <span className="mx-1">·</span>
                      {v.professional_name}
                      <span className="mx-1">·</span>
                      {format(new Date(v.created_at), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container rounded-3xl border-2 border-dashed border-border">
          <ShieldCheck className="w-12 h-12 text-on-surface-variant/30 mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Aucune validation</h3>
          <p className="text-sm text-on-surface-variant mt-2 text-center max-w-sm">
            Vous n'avez encore soumis aucune recommandation ou signalement.
          </p>
        </div>
      )}
    </div>
  );
}
