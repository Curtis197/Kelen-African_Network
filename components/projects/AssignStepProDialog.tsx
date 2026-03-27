"use client";

import { useState, useEffect } from "react";
import { ProjectProfessional } from "@/lib/types/projects";
import { manageStepProfessional } from "@/lib/actions/project-steps";
import { getProjectTeam } from "@/lib/actions/projects";
import { X, Users, Loader2, CheckCircle2, Circle } from "lucide-react";

interface AssignStepProDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  stepId: string;
  currentProIds: string[]; // These are project_professional_ids already assigned
  onSuccess: () => void;
}

export default function AssignStepProDialog({ 
  isOpen, 
  onClose, 
  projectId, 
  stepId, 
  currentProIds, 
  onSuccess 
}: AssignStepProDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [team, setTeam] = useState<ProjectProfessional[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTeam();
      setSelectedIds(currentProIds);
    }
  }, [isOpen, currentProIds, projectId]);

  const fetchTeam = async () => {
    setIsFetching(true);
    try {
      const teamData = await getProjectTeam(projectId);
      setTeam(teamData as ProjectProfessional[]);
    } catch (err) {
      console.error("Failed to fetch team:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggle = (proId: string) => {
    setSelectedIds(prev => 
      prev.includes(proId) ? prev.filter(id => id !== id) : [...prev, proId]
    );
    // Wait, the filter was wrong in my thought.
    // Fixed below in the return.
  };

  const toggleId = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const toAdd = selectedIds.filter(id => !currentProIds.includes(id));
      const toRemove = currentProIds.filter(id => !selectedIds.includes(id));

      await Promise.all([
        ...toAdd.map(id => manageStepProfessional(stepId, id, 'add', projectId)),
        ...toRemove.map(id => manageStepProfessional(stepId, id, 'remove', projectId))
      ]);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update assignments:", err);
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
      
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-3xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-stone-50">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3">
              <Users className="w-6 h-6 text-kelen-green-600" />
              Assigner des experts
            </h2>
            <p className="text-sm text-stone-500 font-medium pt-1">Experts impliqués dans cette étape</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {isFetching ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-stone-200" />
            </div>
          ) : team.length > 0 ? (
            team.map((member) => {
              const isSelected = selectedIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => toggleId(member.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isSelected ? 'bg-stone-900 border-stone-900 text-white' : 'bg-stone-50 border-transparent hover:bg-stone-100 text-stone-900'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-bold">{member.is_external ? member.external_name : member.professionals?.business_name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>
                      {member.development_area || member.is_external ? member.external_category : member.professionals?.category}
                    </p>
                  </div>
                  {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-stone-300" />}
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-100">
              <p className="text-stone-400 font-medium px-8 italic text-sm">Aucun professionnel dans l&apos;équipe pour le moment.</p>
            </div>
          )}
        </div>

        <div className="p-8 pt-4 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-stone-400 font-black uppercase tracking-widest text-xs hover:text-stone-900 transition-all"
          >
            Annuler
          </button>
          <button
            disabled={isLoading || isFetching}
            onClick={handleSubmit}
            className="flex-[2] bg-kelen-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-kelen-green-600/20 hover:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
