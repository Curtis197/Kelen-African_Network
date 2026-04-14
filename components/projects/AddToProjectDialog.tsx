"use client";

import { useState } from "react";
import { Plus, X, FolderOpen, ChevronRight, Check } from "lucide-react";
import { manageProjectProfessional } from "@/lib/actions/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  category?: string;
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
  const [newArea, setNewArea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  console.log('[ADD_TO_PROJECT_DIALOG] Props received:', { professionalId, professionalName, projectsCount: userProjects.length });

  const handleAdd = async (area: string) => {
    if (!selectedProjectId) {
      console.error('[ADD_TO_PROJECT_DIALOG] No project selected!');
      return;
    }

    console.log('[ADD_TO_PROJECT_DIALOG] Attempting to add pro to project:', {
      projectId: selectedProjectId,
      professionalId,
      area,
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
                userProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setStep("area");
                    }}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-stone-50 hover:bg-kelen-green-50 group transition-all"
                  >
                    <div className="text-left">
                      <p className="font-bold text-stone-900 group-hover:text-kelen-green-700">{project.title}</p>
                      <p className="text-xs text-stone-400 uppercase tracking-widest font-black mt-0.5">{project.category}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-kelen-green-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))
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
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                  Domaine de recherche (ex: Juridique, Design...)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="Entrez un domaine..."
                    autoFocus
                    className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("project")}
                  className="flex-1 py-4 text-stone-400 font-black uppercase tracking-widest text-xs hover:text-stone-900 transition-all"
                >
                  Retour
                </button>
                <button
                  disabled={!newArea || isSubmitting}
                  onClick={() => handleAdd(newArea)}
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
