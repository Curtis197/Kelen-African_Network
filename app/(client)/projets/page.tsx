"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getProjectImages, getAllProjectsMainImages, type ProjectImage } from "@/lib/actions/project-images";
import { Network, ShieldCheck, FolderOpen, ChevronRight, Edit, CreditCard, MapPin, Filter, PlusCircle, Home, PencilRuler } from "lucide-react";
import Image from "next/image";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ProjectCard = dynamic(() => import("@/components/projects/ProjectCard").then(mod => mod.ProjectCard), { 
  ssr: true,
  loading: () => <div className="h-24 sm:h-28 lg:h-32 rounded-xl sm:rounded-2xl bg-surface-container-low animate-pulse" />
});

interface Project {
  id: string;
  title: string;
  category: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
  location_country?: string;
  location_formatted?: string;
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
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectImages, setProjectImages] = useState<Record<string, string>>({});
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
      const projectsData = (data as Project[]) || [];
      setProjects(projectsData);

      // Fetch images for all projects in one batch
      const projectIds = projectsData.map(p => p.id);
      console.log('[PROJECTS-LIST] Fetching images for', projectIds.length, 'projects in batch');
      const imagesMap = await getAllProjectsMainImages(projectIds);
      console.log('[PROJECTS-LIST] Images map loaded:', Object.keys(imagesMap).length);
      setProjectImages(imagesMap);
      console.log('[PROJECTS-LIST] Images map:', imagesMap);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-12">
        {/* Dashboard Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-10 lg:mb-12 gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-headline font-bold text-on-surface leading-tight tracking-tight">
              Mes Projets
            </h1>
            <p className="text-on-surface-variant mt-2 text-sm sm:text-base lg:text-lg max-w-xl">
              Suivez l&apos;avancement de vos projets et les professionnels associés.
            </p>
          </div>
          <Link
            href="/projets/nouveau"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-headline font-bold flex items-center justify-center gap-2 sm:gap-3 shadow-lg sm:shadow-xl shadow-primary/10 hover:scale-[0.98] transition-all text-sm sm:text-base"
          >
            <PlusCircle className="text-lg sm:text-xl" />
            <span>+ Nouveau Projet</span>
          </Link>
        </section>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Project List (Left/Main section) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg sm:text-xl font-headline font-bold text-on-surface">Mes Projets</h3>
              <div className="flex gap-2">
                <button className="p-2 bg-surface-container-low rounded-lg text-on-surface-variant hover:text-primary transition-colors">
                  <Filter />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 sm:h-28 lg:h-32 rounded-2xl sm:rounded-3xl bg-surface-container-low animate-pulse" />
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {projects.map((project, idx) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    imageUrl={projectImages[project.id]}
                    index={idx}
                    onEdit={(id) => router.push(`/projets/${id}/modifier`)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-2xl sm:rounded-3xl lg:rounded-[2rem] p-8 sm:p-12 lg:p-16 text-center space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-surface-container-lowest rounded-full flex items-center justify-center">
                  <FolderOpen className="text-3xl sm:text-4xl lg:text-5xl text-on-surface-variant opacity-20" />
                </div>
                <h3 className="text-xl sm:text-2xl font-headline font-bold text-on-surface">Aucun projet</h3>
                <p className="text-on-surface-variant text-sm sm:text-base max-w-sm mx-auto">
                  Vous n&apos;avez pas encore créé de projet. Commencez par ajouter votre première réalisation.
                </p>
                <Link
                  href="/projets/nouveau"
                  className="inline-flex px-6 sm:px-8 py-3 bg-primary text-white rounded-xl font-headline font-bold hover:scale-[0.98] transition-all text-sm sm:text-base"
                >
                  Créer mon premier projet
                </Link>
              </div>
            )}
          </div>

          {/* Quick Statistics / Summary (Right section) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 sm:top-28 space-y-6 sm:space-y-8">
              <div className="bg-surface-container-lowest rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl shadow-surface-container-high/40 space-y-6 sm:space-y-8">
                <h3 className="text-lg sm:text-xl font-headline font-bold text-on-surface">Aperçu Général</h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 sm:p-6 bg-surface-container-low rounded-xl sm:rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">En cours</p>
                    <p className="text-2xl sm:text-3xl font-headline font-extrabold text-primary">
                      {projects.filter(p => p.status === 'en_cours').length}
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 bg-surface-container-low rounded-xl sm:rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Terminés</p>
                    <p className="text-2xl sm:text-3xl font-headline font-extrabold text-on-surface">
                      {projects.filter(p => p.status === 'termine').length}
                    </p>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 border-t border-surface-container/50 space-y-3 sm:space-y-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Garantie Kelen</p>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/10">
                    <ShieldCheck className="text-primary text-lg sm:text-xl flex-shrink-0" />
                    <p className="text-xs sm:text-sm font-medium text-on-surface-variant">
                      Kelen sécurise vos transactions et vérifie l&apos;historique de vos partenaires.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative CTA */}
              <div className="bg-gradient-to-br from-on-surface to-stone-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <Network className="text-6xl sm:text-7xl lg:text-9xl" />
                </div>
                <div className="relative z-10 space-y-3 sm:space-y-4">
                  <h4 className="text-lg sm:text-xl font-headline font-bold">Le Réseau Kelen</h4>
                  <p className="text-xs sm:text-sm opacity-70 leading-relaxed">
                    Accédez à l&apos;annuaire des professionnels vérifiés et comparez-les pour votre projet.
                  </p>
                  <Link href="/recherche" className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-lg transition-colors inline-block">
                    Explorer le réseau
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
