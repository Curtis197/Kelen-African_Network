"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ProjectStepsSection from "@/components/projects/ProjectStepsSection";
import { DevelopmentAreaRow } from "@/components/projects/DevelopmentAreaRow";
import { DEVELOPMENT_AREAS } from "@/lib/constants/projects";
import { ProjectProfessional, ProjectStep, ProjectArea } from "@/lib/types/projects";
import { createProjectArea, deleteProjectArea, getProjectAreas, addProjectDevelopmentArea, removeProjectDevelopmentArea } from "@/lib/actions/projects";
import { getProjectSteps } from "@/lib/actions/project-steps";
import { getProjectImages, type ProjectImage } from "@/lib/actions/project-images";
import { ProjectImageCarousel } from "@/components/projects/ProjectImageCarousel";
import { generateProjectPdf } from "@/lib/actions/project-pdf";
import { Plus, Trash2, Users, FileJson, Edit, FolderSync, Book, LayoutGrid, MapPin, ChevronDown } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
  location_country?: string;
  location_formatted?: string;
  budget_total: number;
  budget_currency: string;
  status: string;
  created_at: string;
  objectives: any[];
  development_areas?: string[] | null;
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
  const [showProjectAreaInput, setShowProjectAreaInput] = useState(false);
  const [newProjectArea, setNewProjectArea] = useState("");
  const [areas, setAreas] = useState<ProjectArea[]>([]);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (projectIdStr) fetchProjectData();
  }, [projectIdStr]);

  const fetchProjectData = async () => {
    console.log('[PROJECT-DETAIL] Starting parallel fetch for project:', projectIdStr);
    setIsLoading(true);
    
    try {
      const [
        projectRes,
        teamRes,
        areasData,
        stepsData,
        imgs
      ] = await Promise.all([
        // Fetch Project
        supabase
          .from("user_projects")
          .select("*")
          .eq("id", projectIdStr)
          .single(),
        
        // Fetch Team
        supabase
          .from("project_professionals")
          .select("*, professionals(business_name, category, portfolio_photos, status, slug)")
          .eq("project_id", projectIdStr)
          .order("rank_order", { ascending: true }),
        
        // Fetch Areas
        getProjectAreas(projectIdStr),
        
        // Fetch Steps
        getProjectSteps(projectIdStr),
        
        // Fetch Images
        getProjectImages(projectIdStr)
      ]);

      console.log('[PROJECT-DETAIL] Parallel fetch complete');

      if (projectRes.error) {
        console.error("[PROJECT-DETAIL] Error fetching project:", projectRes.error);
        if (projectRes.error.code === '42501') {
          console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on user_projects!');
        }
      } else {
        setProject(projectRes.data as Project);
      }

      if (teamRes.error) {
        console.error("[PROJECT-DETAIL] Error fetching team:", teamRes.error);
      } else {
        setTeam(teamRes.data as ProjectProfessional[]);
      }

      setAreas(areasData as ProjectArea[]);
      setSteps(stepsData as ProjectStep[]);
      setImages(imgs);

    } catch (err) {
      console.error("[PROJECT-DETAIL] Unexpected error during fetch:", err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
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

  const addDevelopmentArea = async (area: string) => {
    console.log('[PROJECT-DETAIL] Adding development area:', area);
    const result = await addProjectDevelopmentArea(projectIdStr, area);
    if (result.success) {
      toast.success(`Domaine "${area}" ajouté au projet`);
      // Update project state
      setProject(prev => prev ? { ...prev, development_areas: result.data as string[] } : null);
      setNewProjectArea("");
      setShowProjectAreaInput(false);
    } else {
      toast.error(`Erreur: ${result.error}`);
    }
  };

  const removeDevelopmentArea = async (area: string) => {
    if (!confirm(`Retirer le domaine "${area}" du projet ?`)) return;
    console.log('[PROJECT-DETAIL] Removing development area:', area);
    const result = await removeProjectDevelopmentArea(projectIdStr, area);
    if (result.success) {
      toast.success(`Domaine "${area}" retiré du projet`);
      // Update project state
      setProject(prev => prev ? { ...prev, development_areas: result.data as string[] } : null);
    } else {
      toast.error(`Erreur: ${result.error}`);
    }
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
      <div className="mx-auto max-w-7xl w-full px-3 sm:px-4 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-on-surface-variant mb-3 sm:mb-4 lg:mb-6 overflow-x-auto scrollbar-hide">
          <Link href="/projets" className="hover:text-primary transition-colors truncate flex-shrink-0 sm:flex-shrink">
            <span className="hidden xs:inline">Mes Réalisations</span>
            <span className="xs:hidden">Projets</span>
          </Link>
          <span className="opacity-30 flex-shrink-0">/</span>
          <span className="text-primary truncate">{project.title}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="flex flex-col gap-4 sm:gap-6 lg:gap-10">
            {/* Title and Status */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[3rem] font-headline font-bold text-on-surface tracking-tight leading-tight break-words">
                {project.title}
              </h1>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-6">
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
                      "appearance-none px-3 sm:px-6 py-2 sm:py-2.5 pr-8 sm:pr-12 rounded-lg sm:rounded-2xl font-headline font-bold text-[10px] sm:text-xs cursor-pointer border-none transition-all shadow-sm group-hover:shadow-md",
                      STATUS_CONFIG[project.status]?.color || "bg-surface-container"
                    )}
                  >
                    <option value="en_preparation">En préparation</option>
                    <option value="en_cours">En cours</option>
                    <option value="en_pause">En pause</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-50" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant text-[10px] sm:text-sm font-medium">
                  <MapPin className="text-sm sm:text-base flex-shrink-0" />
                  <span className="truncate">{project.location_formatted || project.location}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant text-[10px] sm:text-sm font-medium">
                  <LayoutGrid className="text-sm sm:text-base flex-shrink-0" />
                  <span className="capitalize truncate">{(project.category || 'non_defini').replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                href={`/projets/${projectIdStr}/journal`}
                className="flex-1 min-w-[120px] sm:flex-none px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 bg-surface-container-low text-on-surface font-headline font-bold rounded-lg sm:rounded-2xl border border-transparent hover:border-surface-container transition-all flex items-center justify-center gap-2 text-[10px] sm:text-sm"
              >
                <Book className="text-base sm:text-xl" />
                <span>Journal</span>
              </Link>
              <Link
                href={`/projets/${projectIdStr}/documents`}
                className="flex-1 min-w-[120px] sm:flex-none px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 bg-surface-container-low text-on-surface font-headline font-bold rounded-lg sm:rounded-2xl border border-transparent hover:border-surface-container transition-all flex items-center justify-center gap-2 text-[10px] sm:text-sm"
              >
                <FolderSync className="text-base sm:text-xl" />
                <span>Documents</span>
              </Link>
              <Link
                href={`/projets/${projectIdStr}/modifier`}
                className="flex-1 min-w-[120px] sm:flex-none px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 bg-surface-container-low text-on-surface font-headline font-bold rounded-lg sm:rounded-2xl border border-transparent hover:border-surface-container transition-all flex items-center justify-center gap-2 text-[10px] sm:text-sm"
              >
                <Edit className="text-base sm:text-xl" />
                <span>Modifier</span>
              </Link>
              <button
                onClick={async () => {
                  console.log('[PROJECT-DETAIL] Exporting PDF for project:', projectIdStr);
                  toast.info("Génération du PDF en cours...");
                  const result = await generateProjectPdf(projectIdStr);
                  if (result.success && result.html) {
                    // Open in new window for printing
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(result.html);
                      printWindow.document.close();
                      printWindow.onload = () => {
                        printWindow.print();
                      };
                      toast.success("PDF généré — utilisez 'Enregistrer en PDF' dans la boîte de dialogue d'impression");
                    } else {
                      toast.error("Veuillez autoriser les popups pour exporter le PDF");
                    }
                  } else {
                    toast.error(result.error || "Erreur lors de la génération du PDF");
                  }
                }}
                className="flex-1 min-w-[120px] sm:flex-none px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 bg-surface-container-low text-on-surface font-headline font-bold rounded-lg sm:rounded-2xl border border-transparent hover:border-surface-container transition-all flex items-center justify-center gap-2 text-[10px] sm:text-sm"
              >
                <FileJson className="text-base sm:text-xl" />
                <span>Exporter PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Image Carousel */}
        {images.length > 0 && (
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <ProjectImageCarousel images={images} projectId={projectIdStr} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8 lg:space-y-12">
            {/* Project Roadmap & Steps */}
            <ProjectStepsSection
              projectId={projectIdStr}
              currency={project.budget_currency}
              initialSteps={steps}
              onStepsChange={fetchProjectData}
            />

            {/* Team / Comparison Section */}
            <section className="space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base sm:text-lg lg:text-2xl font-headline font-bold text-on-surface">Moteur de Comparaison</h3>
                  <p className="text-on-surface-variant font-medium mt-1 text-[10px] sm:text-sm lg:text-base">Sélectionnez et classez les meilleurs experts pour chaque domaine.</p>
                  <p className="text-on-surface-variant/60 text-[8px] sm:text-[9px] font-medium mt-1">Les domaines sont automatiquement créés quand vous ajoutez un professionnel.</p>
                </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <div className="relative self-start">
                      <button
                        onClick={() => setShowAreaSelector(!showAreaSelector)}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-primary text-white text-[9px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all"
                      >
                        <Plus className="text-sm sm:text-base" />
                        <span className="hidden sm:inline">Ajouter un domaine</span>
                        <span className="sm:hidden">Domaine</span>
                      </button>

                      {showAreaSelector && (
                        <div className="absolute left-0 mt-3 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-outline-variant/30 p-2 z-50">
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

                    <Link
                      href={`/projets/${projectIdStr}/pros`}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-surface-container-low text-on-surface text-[9px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-2xl border border-transparent hover:border-surface-container transition-all"
                    >
                      <Users className="text-sm sm:text-base" />
                      <span className="hidden sm:inline">Gérer les Professionnels</span>
                      <span className="sm:hidden">Pros</span>
                    </Link>
                  </div>
              </div>

              <div className="space-y-6 sm:space-y-8 lg:space-y-12">
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
                  <div className="p-6 sm:p-8 lg:p-12 text-center bg-surface-container-low rounded-xl sm:rounded-3xl border-2 border-dashed border-outline-variant/30">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-on-surface-variant opacity-30" />
                    </div>
                    <h4 className="text-base sm:text-lg font-headline font-bold text-on-surface">Initialisez vos domaines</h4>
                    <p className="text-on-surface-variant font-medium mt-1.5 text-[10px] sm:text-sm max-w-xs mx-auto">Ajoutez des domaines d&apos;intervention pour commencer à comparer des professionnels.</p>
                    <button
                      onClick={() => setShowAreaSelector(true)}
                      className="mt-4 sm:mt-6 px-4 sm:px-6 py-2.5 bg-primary/10 text-primary rounded-lg font-headline font-bold hover:bg-primary/20 transition-all font-body text-[10px] sm:text-sm"
                    >
                      Choisir un premier domaine
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Project Development Areas */}
            <section className="bg-surface-container-lowest p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-surface-container-high/50">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base lg:text-xl font-headline font-bold text-on-surface">Domaines du Projet</h3>
                <span className="px-2 sm:px-3 py-1 bg-surface-container-high text-on-surface-variant text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg border border-outline-variant/30">
                  {(project?.development_areas?.length || 0)}
                </span>
              </div>

              {/* Display existing areas */}
              {project?.development_areas && project.development_areas.length > 0 && (
                <div className="space-y-2 mb-4">
                  {project.development_areas.map((area) => (
                    <div
                      key={area}
                      className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg group hover:bg-surface-container transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-medium text-on-surface truncate flex-1">{area}</span>
                      <button
                        onClick={() => removeDevelopmentArea(area)}
                        className="ml-2 p-1 text-on-surface-variant/40 hover:text-kelen-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Retirer ce domaine"
                      >
                        <Trash2 className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new area */}
              {showProjectAreaInput ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={newProjectArea}
                      onChange={(e) => {
                        console.log('[PROJECT-DETAIL] Search areas input:', e.target.value);
                        setNewProjectArea(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newProjectArea.trim()) {
                          addDevelopmentArea(newProjectArea.trim());
                        }
                        if (e.key === "Escape") {
                          setShowProjectAreaInput(false);
                          setNewProjectArea("");
                        }
                      }}
                      placeholder="Nom du domaine..."
                      autoFocus
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  {/* Suggestions list */}
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                    {DEVELOPMENT_AREAS
                      .filter(area => 
                        area.toLowerCase().includes(newProjectArea.toLowerCase()) && 
                        area !== "Autre" &&
                        !(project?.development_areas || []).includes(area)
                      )
                      .map((area) => (
                        <button
                          key={area}
                          onClick={() => {
                            console.log('[PROJECT-DETAIL] Area suggestion selected:', area);
                            addDevelopmentArea(area);
                          }}
                          className="w-full text-left px-3 py-2 text-[10px] font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        >
                          {area}
                        </button>
                      ))}
                    
                    {newProjectArea && !DEVELOPMENT_AREAS.some(a => a.toLowerCase() === newProjectArea.toLowerCase()) && (
                      <button
                        onClick={() => addDevelopmentArea(newProjectArea.trim())}
                        className="w-full text-left px-3 py-2 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg border border-dashed border-primary/20 transition-all flex items-center gap-1"
                      >
                        <Plus className="text-xs" />
                        Créer &quot;{newProjectArea}&quot;
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-outline-variant/10">
                    <button
                      onClick={() => {
                        console.log('[PROJECT-DETAIL] Cancel area addition');
                        setShowProjectAreaInput(false);
                        setNewProjectArea("");
                      }}
                      className="flex-1 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowProjectAreaInput(true)}
                  className="w-full py-3 border-2 border-dashed border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="text-sm" />
                  Ajouter un domaine
                </button>
              )}

              <p className="text-[8px] sm:text-[9px] text-on-surface-variant/60 mt-3">
                Ces domaines seront disponibles quand vous ajouterez un professionnel.
              </p>
            </section>

            {/* Financial Status */}
            <section className="bg-surface-container-lowest p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-surface-container-high/50">
              <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                <h3 className="text-sm sm:text-base lg:text-xl font-headline font-bold text-on-surface">Budget</h3>
                <span className="px-2 sm:px-3 py-1 bg-surface-container-high text-on-surface-variant text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg border border-outline-variant/30">Indicatif</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 flex items-center justify-center mb-4 sm:mb-6 lg:mb-8">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 224 224">
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
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold text-on-surface tracking-tighter">{spentPercent}%</span>
                    <span className="text-[7px] sm:text-[8px] lg:text-[10px] uppercase font-black text-on-surface-variant tracking-[0.12em] sm:tracking-[0.2em] mt-0.5 sm:mt-1">Investi</span>
                  </div>
                </div>

                <div className="w-full space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-3 sm:p-4 lg:p-5 bg-surface-container-low rounded-lg sm:rounded-xl">
                    <span className="text-[7px] sm:text-[8px] lg:text-[10px] font-black text-on-surface-variant uppercase tracking-[0.12em] sm:tracking-[0.15em]">Total alloué</span>
                    <span className="font-headline font-bold text-on-surface text-[10px] sm:text-xs lg:text-sm">
                      {project.budget_total.toLocaleString()} {project.budget_currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 sm:p-4 lg:p-5 bg-primary-container/20 rounded-lg sm:rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[8px] lg:text-[10px] font-black text-primary uppercase tracking-[0.12em] sm:tracking-[0.15em]">Dépensé</span>
                      <span className="text-[6px] sm:text-[7px] font-bold text-primary/60 uppercase tracking-[0.08em] mt-0.5">Total déclaratif</span>
                    </div>
                    <span className="font-headline font-bold text-on-surface text-[10px] sm:text-xs lg:text-sm">
                      {totalSpent.toLocaleString()} {project.budget_currency}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
