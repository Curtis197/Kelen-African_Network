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
  nextOrderIndex?: number;
}

export default function AddStepDialog({ isOpen, onClose, projectId, step, onSuccess, nextOrderIndex = 0 }: AddStepDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    comment: "",
    status: "pending",
    budget: 0,
    expenditure: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);

    try {
      const result = await upsertProjectStep({
        ...formData,
        project_id: projectId,
        id: step?.id,
        status: formData.status as any,
        order_index: step?.order_index ?? nextOrderIndex,
      });

      if (result?.error) {
        setSubmitError(result.error);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-surface-container-low rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-3xl border border-border overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 pb-3 sm:pb-4 flex items-center justify-between border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-on-surface tracking-tight">
              {step ? "Modifier l'étape" : "Nouvelle étape"}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium pt-1 truncate">Structurez votre roadmap projet</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-3 rounded-full hover:bg-surface-container text-on-surface-variant/60 hover:text-on-surface transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {submitError && (
            <div className="rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-100 p-3 sm:p-4 text-xs sm:text-sm text-rose-700 font-medium">
              {submitError}
            </div>
          )}
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/60 ml-1">
                Titre de l&apos;étape
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Fondation & Gros œuvre"
                className="w-full bg-surface-container border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-on-surface focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium placeholder:text-on-surface-variant/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/60 ml-1">
                Commentaires / Notes
              </label>
              <textarea
                value={formData.comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Détails sur l'avancement ou points d'attention..."
                rows={3}
                className="w-full bg-surface-container border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-on-surface focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium resize-none placeholder:text-on-surface-variant/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/60 ml-1">
                  Budget Alloué
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full bg-surface-container border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-on-surface focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
                  />
                  <Calculator className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-on-surface-variant/30" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/60 ml-1">
                  Dépense Réelle
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.expenditure}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, expenditure: Number(e.target.value) })}
                    className="w-full bg-surface-container border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-on-surface focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
                  />
                  <Check className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-on-surface-variant/30" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/60 ml-1">
                Statut actuel
              </label>
              <select
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-surface-container border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-on-surface focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium appearance-none"
              >
                <option value="pending">En attente</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="on_hold">En pause</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4 pt-2 sm:pt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 sm:py-4 text-stone-400 font-black uppercase tracking-widest text-[10px] sm:text-xs hover:text-stone-900 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] bg-stone-900 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-stone-900/10 hover:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
