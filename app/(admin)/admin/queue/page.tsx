import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "File de vérification — Kelen Admin",
};

export default async function AdminQueuePage() {
  const supabase = await createClient();

  // Fetch queue items with professional details
  const { data: queueItems } = await supabase
    .from("verification_queue")
    .select(`
      id,
      item_type,
      item_id,
      status,
      created_at,
      professional:professionals(business_name, slug)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const recommendations = queueItems?.filter(
    (item) => item.item_type === "recommendation"
  ) || [];
  const signals = queueItems?.filter((item) => item.item_type === "signal") || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        File de vérification
      </h1>
      <p className="mt-1 text-muted-foreground">
        {queueItems?.length || 0} éléments en attente de vérification.
      </p>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        <span className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white">
          Tous ({queueItems?.length || 0})
        </span>
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
          Recommandations ({recommendations.length})
        </button>
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
          Signaux ({signals.length})
        </button>
      </div>

      {/* Queue list */}
      <div className="mt-4 rounded-xl border border-border bg-white">
        <div className="divide-y divide-border">
          {queueItems && queueItems.length > 0 ? (
            queueItems.map((item: any) => (
              <Link
                key={item.id}
                href={`/admin/queue/${item.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  {/* Priority indicator - Mocked if not in DB, but we use color by type */}
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      item.item_type === "signal"
                        ? "bg-kelen-red-500"
                        : "bg-kelen-green-500"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.item_type === "recommendation"
                            ? "bg-kelen-green-50 text-kelen-green-700"
                            : "bg-kelen-red-50 text-kelen-red-700"
                        }`}
                      >
                        {item.item_type === "recommendation"
                          ? "Recommandation"
                          : "Signal"}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {item.professional?.business_name || "Professionnel inconnu"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Soumis le {" "}
                      {new Date(item.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="shrink-0 rounded-lg bg-kelen-yellow-50 px-3 py-1.5 text-xs font-medium text-kelen-yellow-700">
                    En attente
                  </span>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              La file de vérification est vide.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
