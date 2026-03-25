"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  title: string;
  category: string;
  location: string;
  status: "en_preparation" | "en_cours" | "en_pause" | "termine" | "annule";
  budget_total: number;
  budget_currency: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  en_preparation: "En préparation",
  en_cours: "En cours",
  en_pause: "En pause",
  termine: "Terminé",
  annule: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  en_preparation: "bg-blue-100 text-blue-700",
  en_cours: "bg-amber-100 text-amber-700",
  en_pause: "bg-stone-100 text-stone-700",
  termine: "bg-emerald-100 text-emerald-700",
  annule: "bg-red-100 text-red-700",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects((data as Project[]) || []);
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <nav className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-3">
              <span>Plateforme</span>
              <span className="text-stone-300">/</span>
              <span className="text-kelen-green-600">Mes Projets</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-stone-900 mb-2">
              Mes Projets
            </h1>
            <p className="text-stone-500 max-w-lg">
              Gérez vos investissements et suivez l&apos;avancement de vos projets en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-stone-100 rounded-xl text-stone-600 hover:bg-stone-200 transition-colors">
              <span className="material-symbols-outlined text-xl">filter_list</span>
            </button>
            <Link
              href="/client/projets/nouveau"
              className="flex items-center gap-2 bg-kelen-green-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-kelen-green-500/20 hover:bg-kelen-green-600 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Nouveau Projet
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/client/projets/${project.id}`}
                className="group bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-stone-200/50"
              >
                <div className="relative h-48 overflow-hidden bg-stone-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-stone-200">
                    {project.category === 'construction' ? 'home_work' : 'architecture'}
                  </span>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md ${STATUS_COLORS[project.status]}`}>
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 group-hover:text-kelen-green-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-stone-500">{project.location}</p>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider text-stone-400">
                        <span>Budget Total</span>
                        <span className="text-stone-900">
                          {project.budget_total.toLocaleString()} {project.budget_currency}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-kelen-green-500 rounded-full transition-all duration-1000" 
                          style={{ width: project.status === 'termine' ? '100%' : '35%' }}
                        />
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-stone-50 hover:bg-kelen-green-500 hover:text-white text-stone-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 group/btn">
                    Gérer le projet
                    <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </Link>
            ))}

            <Link
              href="/client/projets/nouveau"
              className="group h-full min-h-[400px] border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-kelen-green-500/50 hover:bg-kelen-green-50/30 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-kelen-green-500 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-stone-900">Nouveau Projet</h3>
                <p className="text-xs text-stone-500 px-12">Lancez une nouvelle initiative immobilière</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-48 h-48 mb-8 bg-stone-50 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-7xl text-stone-300">account_tree</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Aucun projet actif</h2>
            <p className="text-stone-500 mb-8 max-w-sm mx-auto">
              Centralisez le suivi de vos travaux et collaborez avec des experts vérifiés.
            </p>
            <Link
              href="/client/projets/nouveau"
              className="px-8 py-3 bg-kelen-green-500 text-white rounded-xl font-bold shadow-lg shadow-kelen-green-500/20 hover:bg-kelen-green-600 transition-all active:scale-95"
            >
              Créer mon premier projet
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
