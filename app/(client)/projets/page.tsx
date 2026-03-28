"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  en_preparation: { label: "Brouillon", color: "bg-surface-container-high text-on-surface-variant" },
  en_cours: { label: "En cours", color: "bg-secondary-container text-on-secondary-container" },
  en_pause: { label: "En pause", color: "bg-error-container/20 text-error" },
  termine: { label: "Terminé", color: "bg-primary-container text-on-primary-container" },
  annule: { label: "Annulé", color: "bg-surface-variant text-on-surface-variant" },
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
    <div className="min-h-screen bg-surface font-body text-on-surface pb-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-12 pt-12">
        {/* Dashboard Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-[2.75rem] font-headline font-bold text-on-surface leading-tight tracking-tight">
              Mes Réalisations
            </h1>
            <p className="text-on-surface-variant mt-2 text-lg max-w-xl">
              Gérez votre portfolio de projets et suivez chaque étape de vos investissements en temps réel.
            </p>
          </div>
          <Link
            href="/projets/nouveau"
            className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-headline font-bold flex items-center gap-3 shadow-xl shadow-primary/10 hover:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span>+ Nouvelle Réalisation</span>
          </Link>
        </section>

        <div className="grid grid-cols-12 gap-8">
          {/* Project List (Left/Main section) */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-headline font-bold text-on-surface">Projets Actifs</h3>
              <div className="flex gap-2">
                <button className="p-2 bg-surface-container-low rounded-lg text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-3xl bg-surface-container-low animate-pulse" />
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {projects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link
                      href={`/projets/${project.id}`}
                      className="group bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-6 hover:shadow-2xl hover:shadow-surface-container-high/50 transition-all duration-300 border border-transparent hover:border-surface-container"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-surface-container-low flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-40">
                          {(project.category || '').toLowerCase() === 'construction' ? 'home_work' : 'architecture'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-headline font-bold text-lg text-on-surface">
                            {project.title}
                          </h4>
                          <span className={cn(
                            "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                            STATUS_CONFIG[project.status]?.color || "bg-surface-container text-on-surface-variant"
                          )}>
                            {STATUS_CONFIG[project.status]?.label || project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {project.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">payments</span>
                            {project.budget_total.toLocaleString()} {project.budget_currency}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                          <span className="material-symbols-outlined">chevron_right</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-[2rem] p-16 text-center space-y-6">
                <div className="w-24 h-24 mx-auto bg-surface-container-lowest rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20">folder_open</span>
                </div>
                <h3 className="text-2xl font-headline font-bold text-on-surface">Aucun projet trouvé</h3>
                <p className="text-on-surface-variant max-w-sm mx-auto">
                  Il semblerait que vous n'ayez pas encore lancé d'initiative. Commencez par créer votre premier projet.
                </p>
                <Link
                  href="/projets/nouveau"
                  className="inline-flex px-8 py-3 bg-primary text-white rounded-xl font-headline font-bold hover:scale-[0.98] transition-all"
                >
                  Lancer mon premier projet
                </Link>
              </div>
            )}
          </div>

          {/* Quick Statistics / Summary (Right section) */}
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-28 space-y-8">
              <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-xl shadow-surface-container-high/40 space-y-8">
                <h3 className="text-xl font-headline font-bold text-on-surface">Aperçu Général</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-surface-container-low rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Actifs</p>
                    <p className="text-3xl font-headline font-extrabold text-primary">
                      {projects.filter(p => p.status === 'en_cours').length}
                    </p>
                  </div>
                  <div className="p-6 bg-surface-container-low rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Budget Total</p>
                    <p className="text-xl font-headline font-extrabold text-on-surface">
                      {projects.length > 0 ? "24.5M" : "0"} <span className="text-xs">XOF</span>
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-surface-container/50 space-y-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Soutien Diplomatique</p>
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <p className="text-sm font-medium text-on-surface-variant">
                      Kelen sécurise vos transactions et vérifie l'historique de vos partenaires.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative CTA */}
              <div className="bg-gradient-to-br from-on-surface to-stone-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <span className="material-symbols-outlined text-9xl">hub</span>
                </div>
                <div className="relative z-10 space-y-4">
                  <h4 className="text-xl font-headline font-bold">Le Réseau Kelen</h4>
                  <p className="text-sm opacity-70 leading-relaxed">
                    Accédez à l&apos;annuaire des professionnels vérifiés et comparez-les pour votre projet.
                  </p>
                  <button className="text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                    Explorer le réseau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
