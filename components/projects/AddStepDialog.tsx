"use client";

import { useState, useEffect } from "react";
import { ProjectStep, ProjectStepStatus } from "@/lib/types/projects";
import { upsertProjectStep } from "@/lib/actions/project-steps";
import { X, Check, Calculator, AlertCircle, Loader2 } from "lucide-react";

interface AddStepDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  step?: ProjectStep;
  onSuccess: () => void;
}

export default function AddStepDialog({ isOpen, onClose, projectId, step, onSuccess }: AddStepDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    comment: "",
    status: "pending",
    budget: 0,
    expenditure: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (step) {
      setFormData({
        title: step.title || "",
        comment: step.comment || "",
        status: step.status || "pending",
        budget: step.budget || 0,
        expenditure: step.expenditure || 0,
      });
    } else {
      setFormData({
        title: "",
        comment: "",
        status: "pending",
        budget: 0,
        expenditure: 0,
      });
    }
  }, [step, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await upsertProjectStep({
        ...formData,
        project_id: projectId,
        id: step?.id,
        status: formData.status as any,
        order_index: step?.order_index || 0
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-3xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-stone-50">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              {step ? "Modifier l'étape" : "Nouvelle étape"}
            </h2>
            <p className="text-sm text-stone-500 font-medium">Structurez votre roadmap projet</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                Titre de l&apos;étape
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Fondation & Gros œuvre"
                className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                Commentaires / Notes
              </label>
              <textarea
                value={formData.comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Détails sur l'avancement ou points d'attention..."
                rows={3}
                className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                  Budget Alloué
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
                  />
                  <Calculator className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                  Dépense Réelle
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.expenditure}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, expenditure: Number(e.target.value) })}
                    className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
                  />
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">
                Statut actuel
              </label>
              <select
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-stone-50 border-none rounded-2xl p-4 text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium appearance-none"
              >
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="on_hold">En pause</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-stone-400 font-black uppercase tracking-widest text-xs hover:text-stone-900 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] bg-stone-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-stone-900/10 hover:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {step ? "Enregistrer" : "Créer l'étape"}
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
