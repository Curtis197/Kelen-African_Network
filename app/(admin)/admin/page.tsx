import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Administration — Kelen",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch real stats
  const [
    { count: totalPros },
    { count: totalUsers },
    { count: pendingVerifs },
    { count: totalRecs },
    { count: totalSignals },
    { count: totalReviews }
  ] = await Promise.all([
    supabase.from("professionals").select("*", { count: 'exact', head: true }),
    supabase.from("users").select("*", { count: 'exact', head: true }),
    supabase.from("verification_queue").select("*", { count: 'exact', head: true }).eq("status", "pending"),
    supabase.from("recommendations").select("*", { count: 'exact', head: true }),
    supabase.from("signals").select("*", { count: 'exact', head: true }),
    supabase.from("reviews").select("*", { count: 'exact', head: true })
  ]);

  // Fetch recent queue items
  const { data: recentQueue } = await supabase
    .from("verification_queue")
    .select(`
      id,
      item_type,
      created_at,
      professional:professionals(business_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Administration</h1>
      <p className="mt-1 text-muted-foreground">
        Vue d&apos;ensemble de la plateforme Kelen.
      </p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Professionnels</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {totalPros || 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Utilisateurs diaspora</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {totalUsers || 0}
          </p>
        </div>
        <div className="rounded-xl border border-kelen-yellow-500/30 bg-kelen-yellow-50/30 p-5">
          <p className="text-sm text-muted-foreground">
            En attente de vérification
          </p>
          <p className="mt-1 text-2xl font-bold text-kelen-yellow-700">
            {pendingVerifs || 0}
          </p>
          <Link
            href="/admin/queue"
            className="mt-2 inline-block text-xs text-kelen-green-600 hover:text-kelen-green-700"
          >
            Voir la file →
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Recommandations</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {totalRecs || 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Signaux</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {totalSignals || 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Avis</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {totalReviews || 0}
          </p>
        </div>
      </div>

      {/* Recent queue items */}
      <div className="mt-8 rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">
            Dernières soumissions
          </h2>
          <Link
            href="/admin/queue"
            className="text-sm text-kelen-green-600 hover:text-kelen-green-700"
          >
            Tout voir →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentQueue && recentQueue.length > 0 ? (
            recentQueue.map((item: any) => (
              <Link
                key={item.id}
                href={`/admin/queue/${item.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
              >
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
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Aucune soumission en attente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
