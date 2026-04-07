"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ProjectStepsSection from "@/components/projects/ProjectStepsSection";
import { DevelopmentAreaRow } from "@/components/projects/DevelopmentAreaRow";
import { DEVELOPMENT_AREAS } from "@/lib/constants/projects";
import { ProjectProfessional, ProjectStep, ProjectArea } from "@/lib/types/projects";
import { createProjectArea, deleteProjectArea, getProjectAreas } from "@/lib/actions/projects";
import { getProjectSteps } from "@/lib/actions/project-steps";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_total: number;
  budget_currency: string;
  status: string;
  created_at: string;
  objectives: any[];
}

// Removed duplicate import

// Deleted redundant Payment interface

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  en_preparation: { label: "Brouillon", color: "bg-surface-container-high text-on-surface-variant" },
  en_cours: { label: "En cours", color: "bg-secondary-container text-on-secondary-container" },
  en_pause: { label: "En pause", color: "bg-error-container/20 text-error" },
  termine: { label: "Terminé", color: "bg-primary-container text-on-primary-container" },
  annule: { label: "Annulé", color: "bg-surface-variant text-on-surface-variant" },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectIdStr = Array.isArray(id) ? id[0] : id || "";
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<ProjectProfessional[]>([]);
  const [steps, setSteps] = useState<ProjectStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAreaSelector, setShowAreaSelector] = useState(false);
  const [areas, setAreas] = useState<ProjectArea[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (projectIdStr) fetchProjectData();
  }, [projectIdStr]);

  const fetchProjectData = async () => {
    setIsLoading(true);
    
    // Fetch Project
    const { data: projectData, error: projectError } = await supabase
      .from("user_projects")
      .select("*")
      .eq("id", projectIdStr)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
    } else {
      setProject(projectData as Project);
    }

    // Fetch Team
    const { data: teamData, error: teamError } = await supabase
      .from("project_professionals")
      .select("*, professionals(business_name, category, portfolio_photos, status, slug)")
      .eq("project_id", projectIdStr)
      .order("rank_order", { ascending: true });

    if (teamError) {
      console.error("Error fetching team:", teamError);
    } else {
      setTeam(teamData as ProjectProfessional[]);
    }

    // Fetch Areas
    const areasData = await getProjectAreas(projectIdStr);
    setAreas(areasData as ProjectArea[]);

    // Fetch Steps (via server action to get associated_pros names)
    const stepsData = await getProjectSteps(projectIdStr);
    setSteps(stepsData as ProjectStep[]);

    setIsLoading(false);
  };

  const addArea = async (area: string) => {
    const result = await createProjectArea(projectIdStr, area);
    if (result?.data) {
      setAreas(prev => [...prev, result.data as ProjectArea]);
    }
    setShowAreaSelector(false);
  };

  const removeArea = async (areaId: string) => {
    if (!confirm("Supprimer ce domaine et retirer tous ses professionnels ?")) return;
    await deleteProjectArea(areaId, projectIdStr);
    setAreas(prev => prev.filter(a => a.id !== areaId));
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("user_projects")
      .update({ status: newStatus })
      .eq("id", projectIdStr);
    if (!error && project) {
      setProject({ ...project, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center font-body">
        <h1 className="text-3xl font-headline font-bold text-on-surface mb-4">Projet introuvable</h1>
        <Link href="/projets" className="text-primary font-bold hover:underline">
          Retour à mes projets
        </Link>
      </div>
    );
  }

  const totalSpent = steps.reduce((acc, step) => acc + (step.expenditure || 0), 0);
  const spentPercent = project.budget_total > 0 ? Math.round((totalSpent / project.budget_total) * 100) : 0;

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant mb-4 sm:mb-6">
          <Link href="/projets" className="hover:text-primary transition-colors truncate">Mes Réalisations</Link>
          <span className="opacity-30 flex-shrink-0">/</span>
          <span className="text-primary truncate">{project.title}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
            {/* Title and Status */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[3rem] font-headline font-bold text-on-surface tracking-tight leading-tight">
                  {project.title}
                </h1>
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-container/20 to-transparent rounded-full flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Sync</span>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
                <div className="relative group">
                  <select
                    value={project.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setProject(prev => prev ? { ...prev, status: newStatus } : null);
                      supabase
                        .from('user_projects')
                        .update({ status: newStatus })
                        .eq('id', projectIdStr)
                        .then(({ error }) => {
                          if (error) toast.error("Erreur de mise à jour");
                          else toast.success("Statut mis à jour");
                        });
                    }}
                    className={cn(
                      "appearance-none px-4 sm:px-6 py-2 sm:py-2.5 pr-10 sm:pr-12 rounded-xl sm:rounded-2xl font-headline font-bold text-xs cursor-pointer border-none transition-all shadow-sm group-hover:shadow-md",
                      STATUS_CONFIG[project.status]?.color || "bg-surface-container"
                    )}
                  >
                    <option value="en_preparation">En préparation</option>
                    <option value="en_cours">En cours</option>
                    <option value="en_pause">En pause</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-50">expand_more</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-xs sm:text-sm font-medium">
                  <span className="material-symbols-outlined text-base flex-shrink-0">location_on</span>
                  <span className="truncate">{project.location}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant text-xs sm:text-sm font-medium">
                  <span className="material-symbols-outlined text-base flex-shrink-0">category</span>
                  <span className="capitalize truncate">{(project.category || 'non_defini').replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href={`/projets/${projectIdStr}/journal`}
                className="flex-1 sm:flex-none px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-surface-container-low text-on-surface font-headline font-bold rounded-xl sm:rounded-2xl border border-transparent hover:border-surface-container transition-all flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">book</span>
                <span>Journal</span>
              </Link>
              <button className="flex-1 sm:flex-none px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-surface-container-low text-on-surface font-headline font-bold rounded-xl sm:rounded-2xl border border-transparent hover:border-surface-container transition-all flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="material-symbols-outlined text-lg sm:text-xl">share</span>
                <span>Partager</span>
              </button>
              <Link
                href={`/projets/nouveau?id=${projectIdStr}`}
                className="flex-1 sm:flex-none px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-primary text-white font-headline font-bold rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-primary/10 hover:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">add_task</span>
                <span>Mise à jour</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Project Roadmap & Steps */}
            <ProjectStepsSection
              projectId={projectIdStr}
              currency={project.budget_currency}
              initialSteps={steps}
              onStepsChange={fetchProjectData}
            />

            {/* Team / Comparison Section */}
            <section className="space-y-6 sm:space-y-8 lg:space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-on-surface">Moteur de Comparaison</h3>
                  <p className="text-on-surface-variant font-medium mt-1 text-xs sm:text-sm lg:text-base">Sélectionnez et classez les meilleurs experts pour chaque domaine.</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowAreaSelector(!showAreaSelector)}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span className="hidden sm:inline">Ajouter un domaine</span>
                    <span className="sm:hidden">Ajouter</span>
                  </button>

                  {showAreaSelector && (
                    <div className="absolute right-0 mt-3 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-outline-variant/30 p-2 z-50">
                      <div className="max-h-64 overflow-y-auto overflow-x-hidden scrollbar-hide">
                        {DEVELOPMENT_AREAS.filter(a => !areas.some(pa => pa.name === a)).map((area) => (
                          <button
                            key={area}
                            onClick={() => addArea(area)}
                            className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-surface-container rounded-xl transition-colors"
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8 sm:space-y-12 lg:space-y-16">
                {areas.map((area) => (
                  <DevelopmentAreaRow
                    key={area.id}
                    areaId={area.id}
                    areaName={area.name}
                    projectId={projectIdStr}
                    professionals={team.filter(m => m.development_area === area.name)}
                    onRefresh={fetchProjectData}
                    onDelete={() => removeArea(area.id)}
                  />
                ))}

                {areas.length === 0 && (
                  <div className="p-8 sm:p-12 lg:p-20 text-center bg-surface-container-low rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] border-2 border-dashed border-outline-variant/30">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-4 sm:mb-6">
                      <span className="material-symbols-outlined text-2xl sm:text-3xl text-on-surface-variant opacity-30">diversity_3</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-headline font-bold text-on-surface">Initialisez vos domaines</h4>
                    <p className="text-on-surface-variant font-medium mt-2 text-xs sm:text-sm max-w-xs mx-auto">Ajoutez des domaines d&apos;intervention pour commencer à comparer des professionnels.</p>
                    <button
                      onClick={() => setShowAreaSelector(true)}
                      className="mt-6 sm:mt-8 px-6 sm:px-8 py-3 bg-primary/10 text-primary rounded-xl font-headline font-bold hover:bg-primary/20 transition-all font-body text-xs sm:text-sm"
                    >
                      Choisir un premier domaine
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Financial Status */}
            <section className="bg-surface-container-lowest p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-surface-container-high/50">
              <div className="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
                <h3 className="text-base sm:text-lg lg:text-xl font-headline font-bold text-on-surface">Budget</h3>
                <span className="px-2 sm:px-3 py-1 bg-surface-container-high text-on-surface-variant text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg border border-outline-variant/30">Indicatif</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 flex items-center justify-center mb-6 sm:mb-8 lg:mb-10">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-surface-container" cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeWidth="16" />
                    <circle
                      className="text-primary transition-all duration-1000 ease-out"
                      cx="112" cy="112" fill="transparent" r="100" stroke="currentColor"
                      strokeWidth="16"
                      strokeDasharray={628.3}
                      strokeDashoffset={628.3 - (628.3 * spentPercent) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-on-surface tracking-tighter">{spentPercent}%</span>
                    <span className="text-[8px] sm:text-[9px] lg:text-[10px] uppercase font-black text-on-surface-variant tracking-[0.15em] sm:tracking-[0.2em] mt-1 sm:mt-2">Investi</span>
                  </div>
                </div>

                <div className="w-full space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center p-4 sm:p-5 bg-surface-container-low rounded-xl sm:rounded-2xl">
                    <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em] sm:tracking-[0.2em]">Total alloué</span>
                    <span className="font-headline font-bold text-on-surface text-xs sm:text-sm">
                      {project.budget_total.toLocaleString()} {project.budget_currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 sm:p-5 bg-primary-container/20 rounded-xl sm:rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[8px] sm:text-[9px] lg:text-[10px] font-black text-primary uppercase tracking-[0.15em] sm:tracking-[0.2em]">Dépensé</span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-primary/60 uppercase tracking-[0.1em] mt-0.5">Total déclaratif</span>
                    </div>
                    <span className="font-headline font-bold text-on-surface text-xs sm:text-sm">
                      {totalSpent.toLocaleString()} {project.budget_currency}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Documents Vault */}
            <section className="bg-surface-container-low p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg lg:text-xl font-headline font-bold text-on-surface">Coffre-fort technique</h3>
                <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg sm:rounded-xl text-primary shadow-sm">
                  <span className="material-symbols-outlined text-lg sm:text-xl">verified_user</span>
                </span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {team.length > 0 ? team.slice(0, 3).map((member) => (
                  <div key={member.id} className="p-4 sm:p-5 bg-surface-container-lowest rounded-xl sm:rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-surface-container rounded-lg flex items-center justify-center text-on-surface-variant flex-shrink-0">
                        <span className="material-symbols-outlined text-base sm:text-xl">description</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface mb-0.5 truncate">Plans Techniques</p>
                        <p className="text-[10px] text-on-surface-variant font-medium truncate">Par {member.is_external ? member.external_name : member.professionals?.business_name}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant opacity-20 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">download</span>
                  </div>
                )) : (
                  <div className="p-6 sm:p-8 lg:p-10 text-center bg-white rounded-2xl sm:rounded-3xl border border-dashed border-outline-variant/30">
                    <span className="material-symbols-outlined text-3xl sm:text-4xl text-on-surface-variant opacity-20 mb-3 sm:mb-4 block">fact_check</span>
                    <p className="text-xs text-on-surface-variant font-medium">Aucun document n&apos;est encore disponible dans le vault.</p>
                  </div>
                )}
              </div>

              <button className="w-full py-4 sm:py-5 bg-on-surface text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-xl sm:rounded-2xl hover:bg-on-surface-variant transition-all mt-2 sm:mt-4">
                Accéder au vault complet
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
