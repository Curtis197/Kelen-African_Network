"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { updateProfessionalRank, updateProfessionalSelection, manageProjectProfessional, updateProjectArea } from "@/lib/actions/projects";
import { AddExternalProModal } from "./AddExternalProModal";
import { ProfessionalStatus } from "@/lib/supabase/types";

import { ProjectProfessional, Professional } from "@/lib/types/projects";

interface DevelopmentAreaRowProps {
  areaId: string;
  areaName: string;
  professionals: ProjectProfessional[];
  projectId: string;
  onRefresh: () => void;
  onDelete: () => void;
}

export function DevelopmentAreaRow({ areaId, areaName, professionals, projectId, onRefresh, onDelete }: DevelopmentAreaRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(areaName);

  const handleRankUpdate = async (linkId: string, currentRank: number, direction: 'up' | 'down') => {
    setIsUpdating(true);
    const newRank = direction === 'up' ? Math.max(0, currentRank - 1) : currentRank + 1;
    await updateProfessionalRank(projectId, linkId, newRank);
    onRefresh();
    setIsUpdating(false);
  };

  const handleStatusUpdate = async (linkId: string, status: 'candidate' | 'shortlisted' | 'finalist') => {
    setIsUpdating(true);
    await updateProfessionalSelection(projectId, linkId, status);
    onRefresh();
    setIsUpdating(false);
  };

  const handleRemove = async (member: ProjectProfessional) => {
    if (!confirm("Retirer ce professionnel de ce domaine ?")) return;
    setIsUpdating(true);
    await manageProjectProfessional(
      projectId, 
      member.professional_id, 
      areaName, 
      'remove', 
      member.is_external,
      member.is_external ? { name: member.external_name || undefined } : undefined
    );
    onRefresh();
    setIsUpdating(false);
  };

  const handleAddExternal = () => {
    setShowAddExternal(true);
  };

  const handleRenameSubmit = async () => {
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === areaName) {
      setIsEditingName(false);
      setEditedName(areaName);
      return;
    }
    setIsUpdating(true);
    await updateProjectArea(areaId, projectId, trimmed);
    onRefresh();
    setIsUpdating(false);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-kelen-green-500 rounded-full" />
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") { setIsEditingName(false); setEditedName(areaName); }
                }}
                className="text-xl font-headline font-bold text-on-surface bg-surface-container-low border border-primary/30 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-primary/20 w-48"
              />
              <button
                onClick={handleRenameSubmit}
                disabled={isUpdating}
                className="p-1.5 text-kelen-green-600 hover:bg-kelen-green-50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-sm">check</span>
              </button>
              <button
                onClick={() => { setIsEditingName(false); setEditedName(areaName); }}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <h4 className="text-xl font-headline font-bold text-on-surface">{areaName}</h4>
          )}
          <span className="px-2.5 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-widest rounded-full">
            {professionals.length} Professionnel{professionals.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/?projectId=${projectId}&areaName=${encodeURIComponent(areaName)}`}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline bg-primary/5 px-4 py-2 rounded-full border border-primary/10 transition-all hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-sm">search</span>
            Trouver un professionnel
          </Link>
          <button
            onClick={handleAddExternal}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Ajouter un externe
          </button>
          <button
            onClick={() => { setIsEditingName(true); setEditedName(areaName); }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
            title="Renommer ce domaine"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-kelen-red-500 transition-colors"
            title="Supprimer ce domaine"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 px-1 scrollbar-hide snap-x">
        {professionals.length > 0 ? (
          professionals.map((member, index) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[320px] md:min-w-[400px] snap-start"
            >
              <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                {/* Selection Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    member.selection_status === 'finalist' ? 'bg-primary text-white' :
                    member.selection_status === 'shortlisted' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {member.selection_status}
                  </span>
                </div>

                <div className="flex gap-5">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container ring-4 ring-white shadow-sm flex items-center justify-center text-on-surface-variant">
                      {member.is_external ? (
                        <span className="material-symbols-outlined text-4xl opacity-20">person</span>
                      ) : (
                        <img
                          src={member.professionals?.portfolio_photos?.[0] || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80"}
                          alt={member.is_external ? member.external_name || "" : member.professionals?.business_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {member.selection_status === 'finalist' && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="material-symbols-outlined text-white text-base font-bold">check</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-headline font-bold text-lg text-on-surface truncate max-w-[150px] text-balance leading-tight">
                        {member.is_external ? member.external_name : member.professionals?.business_name}
                      </h5>
                      {member.is_external && (
                        <span className="material-symbols-outlined text-sm text-on-surface-variant/40" title="Profil externe">public</span>
                      )}
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1 opacity-70">
                      {member.is_external ? member.external_category || areaName : member.professionals?.category}
                    </p>

                    {member.private_note && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/5">
                        <p className="text-[10px] text-on-surface-variant/80 leading-relaxed italic">
                          "{member.private_note}"
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="flex items-center bg-surface-container px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-bold text-on-surface-variant">Rang #{member.rank_order + 1}</span>
                      </div>
                      <div className="flex gap-1">
                         <button 
                           onClick={() => handleRankUpdate(member.id, member.rank_order, 'up')}
                           disabled={member.rank_order === 0 || isUpdating}
                           className="w-7 h-7 flex items-center justify-center bg-surface-container hover:bg-surface-container-high rounded-full disabled:opacity-30 transition-colors"
                         >
                           <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                         </button>
                         <button 
                           onClick={() => handleRankUpdate(member.id, member.rank_order, 'down')}
                           disabled={isUpdating}
                           className="w-7 h-7 flex items-center justify-center bg-surface-container hover:bg-surface-container-high rounded-full disabled:opacity-30 transition-colors"
                         >
                           <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                         </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-outline-variant/20 flex items-center gap-3">
                  <div className="flex-1 flex gap-2">
                    <button 
                      onClick={() => handleStatusUpdate(member.id, 'shortlisted')}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        member.selection_status === 'shortlisted' ? 'bg-secondary-container text-on-secondary-container shadow-md' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      Shortlist
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(member.id, 'finalist')}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        member.selection_status === 'finalist' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      Finaliser
                    </button>
                  </div>
                  <button 
                    onClick={() => handleRemove(member)}
                    className="p-2.5 text-on-surface-variant/40 hover:text-kelen-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>

                {!member.is_external && member.professionals?.slug && (
                  <Link 
                    href={`/pro/${member.professionals.slug}`}
                    className="absolute bottom-6 right-6 p-2 rounded-full bg-surface-container opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </Link>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="w-full py-12 text-center bg-surface-container-low/50 rounded-3xl border border-dashed border-outline-variant/30">
             <p className="text-on-surface-variant font-medium italic">Aucun profil à comparer dans ce domaine.</p>
             <Link
               href={`/?projectId=${projectId}&areaName=${encodeURIComponent(areaName)}`}
               className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-2 mx-auto justify-center"
             >
               <span className="material-symbols-outlined text-sm">search</span>
               Trouver un professionnel
             </Link>
          </div>
        )}
      </div>
      
      <AddExternalProModal 
        isOpen={showAddExternal}
        onClose={() => setShowAddExternal(false)}
        projectId={projectId}
        areaName={areaName}
        onSuccess={onRefresh}
      />
    </div>
  );
}
