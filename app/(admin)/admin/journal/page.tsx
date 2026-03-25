import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal d'activité — Kelen Admin",
};

export default async function AdminJournalPage() {
  const supabase = await createClient();

  // Fetch completed verification items as log entries
  const { data: logs } = await supabase
    .from("verification_queue")
    .select(`
      id,
      item_type,
      status,
      updated_at,
      professional:professionals(business_name)
    `)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(20);

  const ACTION_STYLES: Record<string, string> = {
    recommendation: "bg-kelen-green-50 text-kelen-green-700",
    signal: "bg-kelen-red-50 text-kelen-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        Journal d&apos;activité
      </h1>
      <p className="mt-1 text-muted-foreground">
        Historique des dernières vérifications et actions administratives.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {logs && logs.length > 0 ? (
            logs.map((log: any) => (
              <div key={log.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      ACTION_STYLES[log.item_type] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {log.item_type === 'recommendation' ? 'Recommandation vérifiée' : 'Signal vérifié'}
                  </span>
                  <span className="text-sm text-foreground font-medium">
                    {log.professional?.business_name || "Professionnel"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Action effectuée par le système de vérification
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {new Date(log.updated_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground italic">
              Aucun historique d&apos;activité récent.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
