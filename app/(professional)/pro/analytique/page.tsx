"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye, CalendarDays, Search, Pointer, ContactRound } from "lucide-react";

interface Stats {
  total_views: number;
  monthly_views: number;
  search_appearances: number;
  profile_clicks: number;
  contact_clicks: number;
}

interface ChartData {
  month: string;
  views: number;
}

interface TrafficSource {
  source: string;
  count: number;
  pct: number;
}

export default function ProAnalyticsPage() {
  const [stats, setStats] = useState<Stats>({
    total_views: 0,
    monthly_views: 0,
    search_appearances: 0,
    profile_clicks: 0,
    contact_clicks: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [sources, setSources] = useState<TrafficSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
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
      // Total Views
      const { count: totalViews } = await supabase
        .from("profile_views")
        .select("*", { count: 'exact', head: true })
        .eq("professional_id", pro.id);

      // Monthly Views (Last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: monthlyViews } = await supabase
        .from("profile_views")
        .select("*", { count: 'exact', head: true })
        .eq("professional_id", pro.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Search Appearances
      const { count: searchViews } = await supabase
        .from("profile_views")
        .select("*", { count: 'exact', head: true })
        .eq("professional_id", pro.id)
        .eq("source", "search");

      // Profile Interactions (All)
      const { count: interactions } = await supabase
        .from("profile_interactions")
        .select("*", { count: 'exact', head: true })
        .eq("professional_id", pro.id);

      // Contact Clicks
      const { count: contacts } = await supabase
        .from("profile_interactions")
        .select("*", { count: 'exact', head: true })
        .eq("professional_id", pro.id)
        .eq("type", "contact_click");

      setStats({
        total_views: totalViews || 0,
        monthly_views: monthlyViews || 0,
        search_appearances: searchViews || 0,
        profile_clicks: interactions || 0,
        contact_clicks: contacts || 0,
      });

      // Prepare Chart Data - Grouping actual views by month for the last 6 months
      const last6Months: { date: Date, month: string, count: number }[] = [];
      const current = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
        last6Months.push({
          date: d,
          month: d.toLocaleDateString('fr-FR', { month: 'short' }),
          count: 0
        });
      }

      const { data: allViews } = await supabase
        .from("profile_views")
        .select("created_at")
        .eq("professional_id", pro.id)
        .gte("created_at", last6Months[0].date.toISOString());

      if (allViews) {
        allViews.forEach(v => {
          const vDate = new Date(v.created_at);
          const monthIndex = last6Months.findIndex(m => 
            m.date.getMonth() === vDate.getMonth() && m.date.getFullYear() === vDate.getFullYear()
          );
          if (monthIndex !== -1) {
            last6Months[monthIndex].count++;
          }
        });
      }

      setChartData(last6Months.map(m => ({ month: m.month, views: m.count })));

      // Traffic Sources
      const { data: viewData } = await supabase
        .from("profile_views")
        .select("source")
        .eq("professional_id", pro.id);

      if (viewData && viewData.length > 0) {
        const counts: Record<string, number> = {};
        viewData.forEach(v => {
          const s = v.source || 'direct';
          counts[s] = (counts[s] || 0) + 1;
        });
        const total = viewData.length;
        const mappedSources = Object.entries(counts).map(([source, count]) => ({
          source: source === 'search' ? 'Recherche Kelen' : source === 'direct' ? 'Lien direct' : source,
          count,
          pct: Math.round((count / total) * 100)
        }));
        setSources(mappedSources.sort((a, b) => b.count - a.count));
      } else {
        setSources([
          { source: "Recherche Kelen", count: 0, pct: 0 },
          { source: "Lien direct", count: 0, pct: 0 }
        ]);
      }
    }
    setIsLoading(false);
  };

  const maxViews = Math.max(...chartData.map((d) => d.views), 1);

  return (
    <main className="max-w-6xl">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Performance & visibilité</h1>
        <p className="mt-2 text-on-surface-variant font-medium">
          Analysez l&apos;impact de votre présence sur Kelen et optimisez votre taux d&apos;engagement.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface-container-low p-5 rounded-3xl border border-border shadow-sm animate-pulse">
              <div className="w-5 h-5 bg-surface-container-high rounded mb-4" />
              <div className="h-3 bg-surface-container-high rounded w-20 mb-2" />
              <div className="h-7 bg-surface-container-high rounded w-12" />
            </div>
          ))
        ) : (
          [
            { label: "Vues totales", val: stats.total_views, icon: Eye },
            { label: "Ce mois", val: stats.monthly_views, icon: CalendarDays },
            { label: "Recherches", val: stats.search_appearances, icon: Search },
            { label: "Interactions", val: stats.profile_clicks, icon: Pointer },
            { label: "Contacts", val: stats.contact_clicks, icon: ContactRound },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-low p-5 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
              <s.icon className="w-5 h-5 text-on-surface-variant/40" />
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-1">{s.label}</p>
                <p className="text-2xl font-black text-on-surface">{s.val.toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-container-low p-8 rounded-3xl border border-border shadow-sm h-64 animate-pulse" />
          <div className="bg-surface-container-low p-8 rounded-3xl border border-border shadow-sm h-64 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Chart */}
        <div className="bg-surface-container-low p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant/60 mb-8">Évolution des vues</h3>
          <div className="flex items-end gap-3 h-48">
            {chartData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-1">
                  {d.views}
                </div>
                <div
                  className="w-full bg-kelen-green-500 rounded-t-lg transition-all duration-500 hover:bg-stone-900"
                  style={{ height: `${(d.views / maxViews) * 100}%` }}
                />
                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-surface-container-low p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant/60 mb-8">Canaux d&apos;acquisition</h3>
          <div className="space-y-6">
            {sources.map((source) => (
              <div key={source.source} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-on-surface">
                  <span className="capitalize">{source.source}</span>
                  <span className="text-on-surface-variant/60">{source.pct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-kelen-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${source.pct}%` }}
                  />
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <p className="text-on-surface-variant text-sm italic text-center py-10">Données sources insuffisantes</p>
            )}
          </div>
        </div>
      </div>
      )}
    </main>
  );
}
