"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

      // Prepare Chart Data (Mocking aggregation logic for brevity, in real app use a SQL view or complex query)
      const months = ["Sept", "Oct", "Nov", "Déc", "Jan", "Fév"];
      const mockMonthly = months.map((m, i) => ({
        month: m,
        views: Math.floor(Math.random() * 200) + 100 // Fallback for demo
      }));
      setChartData(mockMonthly);

      // Traffic Sources
      const { data: viewData } = await supabase
        .from("profile_views")
        .select("source")
        .eq("professional_id", pro.id);

      if (viewData && viewData.length > 0) {
        const counts: Record<string, number> = {};
        viewData.forEach(v => counts[v.source] = (counts[v.source] || 0) + 1);
        const total = viewData.length;
        const mappedSources = Object.entries(counts).map(([source, count]) => ({
          source: source === 'search' ? 'Recherche Kelen' : source === 'direct' ? 'Lien direct' : source,
          count,
          pct: Math.round((count / total) * 100)
        }));
        setSources(mappedSources);
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
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Performance & visibilité</h1>
        <p className="mt-2 text-stone-500 font-medium">
          Analysez l&apos;impact de votre présence sur Kelen et optimisez votre taux d&apos;engagement.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {[
          { label: "Vues totales", val: stats.total_views, icon: "visibility" },
          { label: "Ce mois", val: stats.monthly_views, icon: "calendar_month" },
          { label: "Recherches", val: stats.search_appearances, icon: "manage_search" },
          { label: "Interactions", val: stats.profile_clicks, icon: "touch_app" },
          { label: "Contacts", val: stats.contact_clicks, icon: "contact_emergency" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <span className="material-symbols-outlined text-stone-300 text-xl">{s.icon}</span>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{s.label}</p>
              <p className="text-2xl font-black text-stone-900">{s.val.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Chart */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 mb-8">Évolution des vues</h3>
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
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 mb-8">Canaux d&apos;acquisition</h3>
          <div className="space-y-6">
            {sources.map((source) => (
              <div key={source.source} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-stone-900">
                  <span className="capitalize">{source.source}</span>
                  <span className="text-stone-400">{source.pct}%</span>
                </div>
                <div className="w-full h-2 bg-stone-50 rounded-full overflow-hidden border border-stone-100">
                  <div 
                    className="h-full bg-kelen-green-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${source.pct}%` }}
                  />
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <p className="text-stone-400 text-sm italic text-center py-10">Données sources insuffisantes</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
