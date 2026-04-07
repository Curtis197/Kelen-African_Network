"use client";

import { useState, useEffect } from "react";
import { ProjectStep } from "@/lib/types/projects";
import { getProjectSteps, deleteProjectStep } from "@/lib/actions/project-steps";
import ProjectStepCard from "./ProjectStepCard";
import AddStepDialog from "./AddStepDialog";
import AssignStepProDialog from "./AssignStepProDialog";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  ChevronDown,
  Loader2,
  TableProperties
} from "lucide-react";

interface ProjectStepsSectionProps {
  projectId: string;
  currency: string;
  initialSteps?: ProjectStep[];
  onStepsChange?: () => void;
}

export default function ProjectStepsSection({ 
  projectId, 
  currency, 
  initialSteps, 
  onStepsChange 
}: ProjectStepsSectionProps) {
  const [steps, setSteps] = useState<ProjectStep[]>(initialSteps || []);
  const [isLoading, setIsLoading] = useState(!initialSteps);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProjectStep | undefined>();
  const [assigningStep, setAssigningStep] = useState<ProjectStep | undefined>();
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    if (initialSteps) {
      setSteps(initialSteps);
      setIsLoading(false);
    } else {
      fetchSteps();
    }
  }, [projectId, initialSteps]);

  const fetchSteps = async () => {
    setIsLoading(true);
    try {
      const data = await getProjectSteps(projectId);
      setSteps(data as ProjectStep[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (step: ProjectStep) => {
    setEditingStep(step);
    setIsAddOpen(true);
  };

  const handleAdd = () => {
    setEditingStep(undefined);
    setIsAddOpen(true);
  };

  const handleManagePros = (step: ProjectStep) => {
    setAssigningStep(step);
    setIsAssignOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette étape ?")) {
      const result = await deleteProjectStep(id, projectId);
      if (result.success) {
        if (onStepsChange) onStepsChange();
        else fetchSteps();
      }
    }
  };

  return (
    <section className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-stone-900 tracking-tight">Roadmap de Réalisation</h3>
          <p className="text-xs sm:text-sm text-stone-500 font-medium pt-1 italic">
            Gérez les phases d&apos;intervention et les budgets associés.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-stone-50 hover:bg-stone-100 rounded-lg sm:rounded-xl text-stone-600 font-black uppercase tracking-widest text-[8px] sm:text-[10px] transition-all border border-stone-100 shadow-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Exporter</span>
              <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportOpen && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-2xl shadow-3xl border border-stone-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-stone-50 text-stone-900 transition-all font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-kelen-green-600" />
                  Tableau Excel (.xlsx)
                </button>
                <button className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-stone-50 text-stone-900 transition-all font-bold text-xs border-t border-stone-50">
                  <TableProperties className="w-4 h-4 text-kelen-green-600" />
                  Rapport PDF (.pdf)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 bg-kelen-green-600 text-white rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[8px] sm:text-[10px] shadow-xl shadow-kelen-green-600/20 hover:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Nouvelle Étape</span>
            <span className="xs:hidden">Étape</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 relative">
        {isLoading ? (
          <div className="p-12 sm:p-24 flex items-center justify-center bg-stone-50 rounded-xl sm:rounded-[2.5rem] border-2 border-dashed border-stone-100">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-stone-200 animate-spin" />
          </div>
        ) : steps.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {steps.map((step) => (
              <ProjectStepCard
                key={step.id}
                step={step}
                currency={currency}
                onEdit={() => handleEdit(step)}
                onDelete={() => handleDelete(step.id)}
                onManagePros={() => handleManagePros(step)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 sm:p-24 text-center bg-stone-50 rounded-xl sm:rounded-[2.5rem] border-2 border-dashed border-stone-100">
            <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-4 sm:mb-8 shadow-sm">
              <span className="material-symbols-outlined text-2xl sm:text-4xl text-stone-200">alt_route</span>
            </div>
            <h4 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight">Initialisez votre roadmap</h4>
            <p className="text-stone-500 font-medium mt-2 sm:mt-3 max-w-sm mx-auto leading-relaxed text-xs sm:text-sm">
              Découpez votre projet en étapes clés pour suivre son avancement, vos paiements et vos experts précisément.
            </p>
            <button
              onClick={handleAdd}
              className="mt-6 sm:mt-10 px-6 sm:px-10 py-3 sm:py-4 bg-stone-900 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-xs shadow-xl shadow-stone-900/10 hover:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              Créer la première étape
            </button>
          </div>
        )}
      </div>

      <AddStepDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        projectId={projectId}
        step={editingStep}
        nextOrderIndex={steps.length > 0 ? Math.max(...steps.map(s => s.order_index)) + 1 : 0}
        onSuccess={() => {
          if (onStepsChange) onStepsChange();
          else fetchSteps();
        }}
      />

      <AssignStepProDialog 
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        projectId={projectId}
        stepId={assigningStep?.id || ""}
        currentProIds={assigningStep ? (assigningStep.step_pros || []).map((p) => p.id) : []}
        onSuccess={() => {
          if (onStepsChange) onStepsChange();
          else fetchSteps();
        }}
      />
    </section>
  );
}
