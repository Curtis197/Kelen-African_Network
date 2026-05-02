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
    pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
    verified: { label: "Vérifié", className: "bg-kelen-green-100 text-kelen-green-700" },
    rejected: { label: "Refusé", className: "bg-red-100 text-red-700" },
    disputed: { label: "Contesté", className: "bg-blue-100 text-blue-700" },
  };

  const recCount   = validations.filter(v => v.type === "recommendation").length;
  const sigCount   = validations.filter(v => v.type === "signal").length;

  return (
    <div className="max-w-4xl">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-kelen-green-50 text-kelen-green-600 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Validation</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Recommandez ou signalez un professionnel
            </p>
          </div>
        </div>

        {/* Summary chips */}
        {!isLoading && validations.length > 0 && (
          <div className="flex items-center gap-2">
            {recCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-kelen-green-50 px-3 py-1.5 text-xs font-semibold text-kelen-green-700">
                <Star className="w-3 h-3" /> {recCount} recommandation{recCount > 1 ? "s" : ""}
              </span>
            )}
            {sigCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                <AlertTriangle className="w-3 h-3" /> {sigCount} signalement{sigCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-7">
        <button
          onClick={() => setActiveTab("my-validations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "my-validations"
              ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
              : "bg-white border border-border text-on-surface-variant hover:border-primary/30 hover:text-on-surface"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Mes validations
          {validations.length > 0 && (
            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
              activeTab === "my-validations" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
            }`}>
              {validations.length}
            </span>
          )}
        </button>
        <Link
          href="/recommandation"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-border text-on-surface-variant hover:border-kelen-green-300 hover:text-kelen-green-700 transition-all"
        >
          <Star className="w-4 h-4" />
          Recommander
        </Link>
        <Link
          href="/signal"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-border text-on-surface-variant hover:border-red-300 hover:text-red-700 transition-all"
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
        <div className="space-y-3">
          {validations.map(v => {
            const conf = statusConfig[v.status] || { label: v.status, className: "bg-surface-container text-on-surface-variant" };
            const isRec = v.type === "recommendation";
            return (
              <div
                key={`${v.type}-${v.id}`}
                className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                  isRec ? "bg-kelen-green-50 text-kelen-green-600" : "bg-red-50 text-red-600"
                }`}>
                  {isRec ? <Star className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-on-surface">
                      {isRec ? "Recommandation" : "Signalement"}
                    </h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${conf.className}`}>
                      {conf.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant flex flex-wrap items-center gap-1">
                    <span className="font-medium text-on-surface">{v.professional_name}</span>
                    <span className="text-border">·</span>
                    <span>{isRec ? "Projet" : "Type"}: {v.project_type || "—"}</span>
                    <span className="text-border">·</span>
                    <span>{format(new Date(v.created_at), "d MMM yyyy", { locale: fr })}</span>
                  </p>
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
          <h3 className="text-lg font-bold text-on-surface">Aucune validation</h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
            Vous n'avez encore soumis aucune recommandation ou signalement. Commencez par recommander un professionnel que vous avez engagé.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/recommandation" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kelen-green-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              <Star className="w-4 h-4" /> Recommander
            </Link>
            <Link href="/signal" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
              <AlertTriangle className="w-4 h-4" /> Signaler
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
