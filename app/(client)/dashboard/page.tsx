"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ActivityItem {
  id: string;
  type: "recommendation" | "signal" | "review";
  professional_name: string;
  professional_slug: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-50 text-amber-700" },
  pending_review: { label: "En examen", className: "bg-amber-50 text-amber-700" },
  verified: { label: "Vérifié", className: "bg-kelen-green-50 text-kelen-green-700" },
  published: { label: "Publié", className: "bg-kelen-green-50 text-kelen-green-700" },
  rejected: { label: "Rejeté", className: "bg-red-50 text-red-700" },
  disputed: { label: "Contesté", className: "bg-purple-50 text-purple-700" },
};

const TYPE_LABELS = {
  recommendation: "Recommandation",
  signal: "Signalement",
  review: "Avis",
};

export default function DashboardPage() {
  const [user, setUser] = useState<{ display_name?: string } | null>(null);
  const [stats, setStats] = useState({ recs: 0, signals: 0, reviews: 0 });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    // Fetch User Details
    const { data: userData } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", authUser.id)
      .single();
    
    setUser(userData);

    // Fetch Stats
    const { count: recCount } = await supabase.from("recommendations").select("*", { count: 'exact', head: true }).eq("submitter_id", authUser.id);
    const { count: sigCount } = await supabase.from("signals").select("*", { count: 'exact', head: true }).eq("submitter_id", authUser.id);
    const { count: revCount } = await supabase.from("reviews").select("*", { count: 'exact', head: true }).eq("reviewer_id", authUser.id);

    setStats({
      recs: recCount || 0,
      signals: sigCount || 0,
      reviews: revCount || 0,
    });

    // Fetch Recent Activity (Parallel)
    const [recs, signals, reviews] = await Promise.all([
      supabase.from("recommendations").select("id, professional_slug, status, created_at").eq("submitter_id", authUser.id).limit(3).order("created_at", { ascending: false }),
      supabase.from("signals").select("id, professional_slug, status, created_at").eq("submitter_id", authUser.id).limit(3).order("created_at", { ascending: false }),
      supabase.from("reviews").select("id, professional_id, status:is_hidden, created_at").eq("reviewer_id", authUser.id).limit(3).order("created_at", { ascending: false }),
    ]);

    // Map and Merge (Simplified for now - in production use pro join)
    const combined: ActivityItem[] = [
      ...(recs.data || []).map(r => ({ ...r, type: "recommendation" as const, professional_name: "Pro Kelen", status: r.status })),
      ...(signals.data || []).map(s => ({ ...s, type: "signal" as const, professional_name: "Pro Kelen", status: s.status })),
      ...(reviews.data || []).map(rv => ({ ...rv, type: "review" as const, professional_name: "Pro Kelen", status: rv.status ? 'hidden' : 'published', professional_slug: '#' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    setActivities(combined);
    setIsLoading(false);
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          {isLoading ? "Chargement..." : `Bonjour, ${user?.display_name?.split(' ')[0] || "Client Kelen"}`}
        </h1>
        <p className="mt-2 text-stone-500 font-medium">
          Bienvenue sur votre centre de contrôle pour une diaspora sereine.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Vérifier un pro", desc: "Consultez les scores de confiance.", href: "/recherche", icon: "verified_user", color: "text-kelen-green-600" },
          { label: "Recommander", desc: "Soutenez un professionnel méritant.", href: "/recommandation", icon: "award_star", color: "text-amber-600" },
          { label: "Signaler", desc: "Signalez un manquement documenté.", href: "/signal", icon: "gavel", color: "text-red-600" },
        ].map((action, i) => (
          <Link key={i} href={action.href} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all group">
            <span className={`material-symbols-outlined text-3xl mb-4 block ${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</span>
            <h3 className="text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors uppercase tracking-tight">{action.label}</h3>
            <p className="mt-2 text-sm text-stone-500 font-medium leading-relaxed">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Internal Stats */}
      <div className="mb-12 grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Recommandations", val: stats.recs, icon: "thumb_up" },
          { label: "Signaux", val: stats.signals, icon: "warning" },
          { label: "Avis publiés", val: stats.reviews, icon: "chat" },
        ].map((s, i) => (
          <div key={i} className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{s.label}</p>
              <p className="text-2xl font-black text-stone-900">{s.val}</p>
            </div>
            <span className="material-symbols-outlined text-stone-300">{s.icon}</span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-widest text-stone-900">Activité récente</h2>
          <span className="text-[10px] font-bold text-stone-400">LES 5 DERNIÈRES ACTIONS</span>
        </div>
        <div className="divide-y divide-stone-100">
          {isLoading ? (
             <div className="p-10 text-center animate-pulse"><div className="h-4 w-1/2 bg-stone-100 rounded mx-auto" /></div>
          ) : activities.length > 0 ? (
            activities.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-8 py-5 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.type === 'recommendation' ? 'bg-amber-50 text-amber-600' :
                    item.type === 'signal' ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {item.type === 'recommendation' ? 'history_edu' : item.type === 'signal' ? 'report' : 'reviews'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">
                      {TYPE_LABELS[item.type]} — <Link href={`/pro/${item.professional_slug}`} className="hover:underline">{item.professional_slug}</Link>
                    </p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">
                      {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  STATUS_STYLES[item.status]?.className || "bg-stone-100 text-stone-500"
                }`}>
                  {STATUS_STYLES[item.status]?.label || item.status}
                </div>
              </div>
            ))
          ) : (
            <div className="px-8 py-20 text-center">
              <span className="material-symbols-outlined text-4xl text-stone-100 mb-4 block">info</span>
              <p className="text-sm text-stone-400 italic">Vous n&apos;avez pas encore d&apos;activité enregistrée.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
