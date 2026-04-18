"use client";

import { useState, useEffect } from "react";
import { Plus, X, FolderOpen, ChevronRight, Check } from "lucide-react";
import { manageProjectProfessional } from "@/lib/actions/projects";
import { getAreas } from "@/lib/actions/taxonomy";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DEVELOPMENT_AREAS } from "@/lib/constants/projects";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  category?: string;
  development_areas?: string[];
}

interface AddToProjectDialogProps {
  professionalId: string;
  professionalName: string;
  userProjects: Project[];
}

export function AddToProjectDialog({
  professionalId,
  professionalName,
  userProjects
}: AddToProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"project" | "area">("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [customArea, setCustomArea] = useState("");
  const [areaMode, setAreaMode] = useState<"predefined" | "custom" | "project">("predefined");
  const [availableAreas, setAvailableAreas] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [projectAreas, setProjectAreas] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const router = useRouter();

  console.log('[ADD_TO_PROJECT_DIALOG] Props received:', { professionalId, professionalName, projectsCount: userProjects.length });

  // Fetch available areas when dialog opens
  useEffect(() => {
    if (isOpen && step === "area" && availableAreas.length === 0) {
      console.log('[ADD_TO_PROJECT_DIALOG] Fetching available areas...');
      setIsLoadingAreas(true);
      getAreas().then(areas => {
        console.log('[ADD_TO_PROJECT_DIALOG] Areas loaded:', areas.length);
        setAvailableAreas(areas);
        setIsLoadingAreas(false);
      }).catch(err => {
        console.error('[ADD_TO_PROJECT_DIALOG] Error fetching areas:', err);
        setIsLoadingAreas(false);
      });
    }
  }, [isOpen, step, availableAreas.length]);

  // Load project areas from user_projects.development_areas when a project is selected
  useEffect(() => {
    if (!selectedProjectId || step !== "area") return;

    console.log('[ADD_TO_PROJECT_DIALOG] Loading project areas for project:', selectedProjectId);
    setProjectAreas([]);
    setSelectedArea(null);

    const selectedProject = userProjects.find(p => p.id === selectedProjectId);
    console.log('[ADD_TO_PROJECT_DIALOG] Found project:', selectedProject);

    if (selectedProject?.development_areas && selectedProject.development_areas.length > 0) {
      console.log('[ADD_TO_PROJECT_DIALOG] ✅ Project has development_areas:', selectedProject.development_areas);
      setProjectAreas(selectedProject.development_areas);
    } else {
      console.log('[ADD_TO_PROJECT_DIALOG] ⚠️ Project has NO development_areas');
    }
  }, [selectedProjectId, step, userProjects]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('[ADD_TO_PROJECT_DIALOG] Dialog opened, resetting state');
      setStep("project");
      setSelectedProjectId(null);
      setSelectedArea(null);
      setCustomArea("");
      setAreaMode("predefined");
      setProjectAreas([]);
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!selectedProjectId) {
      console.error('[ADD_TO_PROJECT_DIALOG] No project selected!');
      return;
    }

    const area = areaMode === "custom" ? customArea : selectedArea;
    if (!area) {
      console.error('[ADD_TO_PROJECT_DIALOG] No area selected!');
      return;
    }

    console.log('[ADD_TO_PROJECT_DIALOG] Attempting to add pro to project:', {
      projectId: selectedProjectId,
      professionalId,
      area,
      areaMode,
    });

    setIsSubmitting(true);
    try {
      const result = await manageProjectProfessional(
        selectedProjectId,
        professionalId,
        area,
        "add"
      );

      console.log('[ADD_TO_PROJECT_DIALOG] Server action result:', result);

      if (result.success) {
        console.log('[ADD_TO_PROJECT_DIALOG] Success! Redirecting to project:', selectedProjectId);
        toast.success(`${professionalName} ajouté au projet`);
        setIsOpen(false);
        router.push(`/projets/${selectedProjectId}`);
      } else {
        console.error('[ADD_TO_PROJECT_DIALOG] Server action returned error:', result.error);
        toast.error(`Erreur lors de l'ajout: ${result.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('[ADD_TO_PROJECT_DIALOG] Exception caught:', error);
      toast.error("Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-kelen-green-600 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-[0.98] transition-all shadow-lg shadow-kelen-green-600/10"
      >
        <FolderOpen className="w-4 h-4" />
        Ajouter au projet
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-3xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-stone-50">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              {step === "project" ? "Choisir un projet" : "Définir le domaine"}
            </h2>
            <p className="text-sm text-stone-500 font-medium">Pour {professionalName}</p>
            {step === "area" && (
              <p className="text-xs text-kelen-green-600 font-bold mt-1">
                Étape 2/2 — Sélectionnez un domaine
              </p>
            )}
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-3 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {step === "project" ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {userProjects.length > 0 ? (
                userProjects.map((project) => {
                  const hasAreas = project.development_areas && project.development_areas.length > 0;
                  console.log(`[ADD_TO_PROJECT_DIALOG] Project ${project.id}:`, {
                    title: project.title,
                    hasAreas,
                    areas: project.development_areas
                  });
                  
                  return (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setStep("area");
                      }}
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-stone-50 hover:bg-kelen-green-50 group transition-all"
                    >
                      <div className="text-left flex-1">
                        <p className="font-bold text-stone-900 group-hover:text-kelen-green-700">{project.title}</p>
                        <p className="text-xs text-stone-400 uppercase tracking-widest font-black mt-0.5">{project.category}</p>
                        {hasAreas && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.development_areas.slice(0, 2).map((area: string) => (
                              <span key={area} className="text-[8px] px-2 py-0.5 bg-kelen-green-100 text-kelen-green-700 rounded-full font-bold">
                                {area}
                              </span>
                            ))}
                            {project.development_areas.length > 2 && (
                              <span className="text-[8px] px-2 py-0.5 bg-stone-200 text-stone-600 rounded-full font-bold">
                                +{project.development_areas.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-kelen-green-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-100">
                  <p className="text-stone-400 font-medium mb-4">Vous n&apos;avez pas encore de projet actif.</p>
                  <button
                    onClick={() => router.push("/projets/nouveau")}
                    className="text-kelen-green-600 font-black uppercase tracking-widest text-xs"
                  >
                    Créer mon premier projet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toggle between 3 area modes */}
              <div className="flex gap-1.5 p-1 bg-stone-100 rounded-lg">
                <button
                  onClick={() => { setAreaMode("predefined"); setSelectedArea(null); }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                    areaMode === "predefined"
                      ? "bg-white text-kelen-green-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  Prédéfinis
                </button>
                <button
                  onClick={() => { setAreaMode("project"); setSelectedArea(null); }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                    areaMode === "project"
                      ? "bg-white text-kelen-green-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {projectAreas.length > 0 ? `Projet (${projectAreas.length})` : "Projet"}
                </button>
                <button
                  onClick={() => { setAreaMode("custom"); setSelectedArea(null); }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                    areaMode === "custom"
                      ? "bg-white text-kelen-green-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  Personnalisé
                </button>
              </div>

              {/* Mode 1: Predefined Areas */}
              {areaMode === "predefined" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                    Domaine de recherche
                  </label>
                  {isLoadingAreas ? (
                    <div className="text-center py-8 text-stone-400">
                      Chargement des domaines...
                    </div>
                  ) : availableAreas.length > 0 ? (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {availableAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => setSelectedArea(area.name)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            selectedArea === area.name
                              ? "border-kelen-green-500 bg-kelen-green-50"
                              : "border-stone-200 bg-stone-50 hover:border-kelen-green-300 hover:bg-kelen-green-50/50"
                          }`}
                        >
                          <span className="font-bold text-stone-900">{area.name}</span>
                          {selectedArea === area.name && (
                            <Check className="w-5 h-5 text-kelen-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-400">
                      Aucun domaine disponible
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Project Areas */}
              {areaMode === "project" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                    Domaines du projet
                  </label>
                  {projectAreas.length > 0 ? (
                    <>
                      <p className="text-[9px] text-stone-400 font-medium mb-2">
                        Ces domaines ont été définis pour ce projet. Sélectionnez-en un.
                      </p>
                      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {projectAreas.map((area) => (
                          <button
                            key={area}
                            onClick={() => setSelectedArea(area)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              selectedArea === area
                                ? "border-kelen-green-500 bg-kelen-green-50"
                                : "border-stone-200 bg-stone-50 hover:border-kelen-green-300 hover:bg-kelen-green-50/50"
                            }`}
                          >
                            <span className="font-bold text-stone-900">{area}</span>
                            {selectedArea === area && (
                              <Check className="w-5 h-5 text-kelen-green-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                      <p className="text-stone-400 font-medium mb-2">Ce projet n&apos;a pas encore de domaines</p>
                      <p className="text-stone-300 text-xs">Ajoutez des domaines dans la page du projet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Custom Area */}
              {areaMode === "custom" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                      Domaine de recherche (ex: Juridique, Design...)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customArea}
                        onChange={(e) => {
                          console.log('[ADD_TO_PROJECT_DIALOG] Custom area input:', e.target.value);
                          setCustomArea(e.target.value);
                        }}
                        placeholder="Rechercher ou entrer un domaine..."
                        autoFocus
                        className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Searchable Suggestions */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 ml-1">
                      Suggestions
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                      {Array.from(new Set([
                        ...DEVELOPMENT_AREAS,
                        ...availableAreas.map(a => a.name)
                      ]))
                        .filter(area => 
                          area.toLowerCase().includes(customArea.toLowerCase()) && 
                          area !== "Autre"
                        )
                        .map((area) => (
                          <button
                            key={area}
                            onClick={() => {
                              console.log('[ADD_TO_PROJECT_DIALOG] Suggestion selected:', area);
                              setCustomArea(area);
                            }}
                            className={cn(
                              "text-xs px-4 py-2 rounded-xl font-bold transition-all border-2",
                              customArea === area
                                ? "bg-kelen-green-600 text-white border-kelen-green-600 shadow-md shadow-kelen-green-600/20"
                                : "bg-stone-50 text-stone-600 border-stone-100 hover:border-kelen-green-200 hover:bg-kelen-green-50/50"
                            )}
                          >
                            {area}
                          </button>
                        ))}
                      
                      {customArea && !DEVELOPMENT_AREAS.some(a => a.toLowerCase() === customArea.toLowerCase()) && (
                        <div className="w-full mt-2 p-3 bg-kelen-green-50 rounded-xl border border-kelen-green-100">
                          <p className="text-[10px] text-kelen-green-700 font-bold flex items-center gap-2">
                            <Plus className="w-3 h-3" />
                            Créer un nouveau domaine : &quot;{customArea}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep("project");
                    setSelectedArea(null);
                    setCustomArea("");
                    setAreaMode("predefined");
                  }}
                  className="flex-1 py-4 text-stone-400 font-black uppercase tracking-widest text-xs hover:text-stone-900 transition-all"
                >
                  Retour
                </button>
                <button
                  disabled={(areaMode !== "custom" && !selectedArea) || (areaMode === "custom" && !customArea) || isSubmitting}
                  onClick={() => handleAdd()}
                  className="flex-[2] bg-kelen-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-kelen-green-600/20 hover:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Ajout..." : (
                    <>
                      Confirmer l&apos;ajout
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
