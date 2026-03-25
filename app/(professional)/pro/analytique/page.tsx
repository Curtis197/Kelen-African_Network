import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytique — Kelen Pro",
};

// Demo data
const DEMO_STATS = {
  total_views: 4521,
  monthly_views: 342,
  search_appearances: 189,
  profile_clicks: 87,
  contact_clicks: 23,
};

const DEMO_MONTHLY_DATA = [
  { month: "Sept", views: 180 },
  { month: "Oct", views: 245 },
  { month: "Nov", views: 312 },
  { month: "Déc", views: 298 },
  { month: "Jan", views: 385 },
  { month: "Fév", views: 342 },
];

const DEMO_TOP_SOURCES = [
  { source: "Recherche Kelen", count: 156, pct: 46 },
  { source: "Lien direct", count: 89, pct: 26 },
  { source: "Recommandation partagée", count: 62, pct: 18 },
  { source: "Autre", count: 35, pct: 10 },
];

export default function ProAnalyticsPage() {
  const maxViews = Math.max(...DEMO_MONTHLY_DATA.map((d) => d.views));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Analytique</h1>
      <p className="mt-1 text-muted-foreground">
        Suivez la performance de votre profil.
      </p>

      {/* Key metrics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs text-muted-foreground">Vues totales</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.total_views.toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs text-muted-foreground">Vues ce mois</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.monthly_views}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs text-muted-foreground">Apparitions recherche</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.search_appearances}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs text-muted-foreground">Clics profil</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.profile_clicks}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs text-muted-foreground">Clics contact</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_STATS.contact_clicks}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Monthly views chart (CSS bar chart) */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold text-foreground">Vues mensuelles</h2>
          <div className="mt-6 flex items-end gap-3" style={{ height: 160 }}>
            {DEMO_MONTHLY_DATA.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-foreground">
                  {d.views}
                </span>
                <div
                  className="w-full rounded-t bg-kelen-green-500"
                  style={{
                    height: `${(d.views / maxViews) * 120}px`,
                  }}
                />
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top sources */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="font-semibold text-foreground">Sources de trafic</h2>
          <div className="mt-6 space-y-4">
            {DEMO_TOP_SOURCES.map((source) => (
              <div key={source.source}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{source.source}</span>
                  <span className="text-muted-foreground">
                    {source.count} ({source.pct}%)
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-kelen-green-500"
                    style={{ width: `${source.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
