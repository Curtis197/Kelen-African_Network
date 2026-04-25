"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { updateProfessionalRank, updateProfessionalSelection, manageProjectProfessional, updateProjectArea } from "@/lib/actions/projects";

const AddProSearchDialog = dynamic(() => import("./AddProSearchDialog").then(mod => mod.AddProSearchDialog), { ssr: false });
const AddExternalProModal = dynamic(() => import("./AddExternalProModal").then(mod => mod.AddExternalProModal), { ssr: false });

import { ProfessionalStatus } from "@/lib/supabase/types";
import { 
  Check, 
  X, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  User, 
  Globe, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink 
} from "lucide-react";

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
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(areaName);
  const [editingMember, setEditingMember] = useState<{ id: string; data: { name: string; phone: string; category: string; location: string; note: string } } | null>(null);

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
      member.is_external ? { name: member.external_name || undefined } : undefined,
      areaId
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 sm:px-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="w-1 sm:w-1.5 h-5 sm:h-6 bg-kelen-green-500 rounded-full flex-shrink-0" />
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                autoFocus
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") { setIsEditingName(false); setEditedName(areaName); }
                }}
                className="text-base sm:text-xl font-headline font-bold text-on-surface bg-surface-container-low border border-primary/30 rounded-lg px-2 sm:px-3 py-1 outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-48"
              />
              <button
                onClick={handleRenameSubmit}
                disabled={isUpdating}
                className="p-1 sm:p-1.5 text-kelen-green-600 hover:bg-kelen-green-50 rounded-lg transition-colors flex-shrink-0"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => { setIsEditingName(false); setEditedName(areaName); }}
                className="p-1 sm:p-1.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <h4 className="text-base sm:text-xl font-headline font-bold text-on-surface break-words">{areaName}</h4>
          )}
          <span className="px-2 sm:px-2.5 py-0.5 bg-surface-container text-on-surface-variant text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-full flex-shrink-0">
            {professionals.length} Pro{professionals.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap pl-3 sm:pl-0">
          <button
            onClick={() => setShowAddSearch(true)}
            className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary hover:underline bg-primary/5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border border-primary/10 transition-all hover:bg-primary/10"
          >
            <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Rechercher</span>
            <span className="xs:hidden">Chercher</span>
          </button>
          <button
            onClick={handleAddExternal}
            className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Externe</span>
          </button>
          <button
            onClick={() => { setIsEditingName(true); setEditedName(areaName); }}
            className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors"
            title="Renommer ce domaine"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-on-surface-variant/40 hover:text-kelen-red-500 transition-colors"
            title="Supprimer ce domaine"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-4 sm:pb-6 px-1 scrollbar-hide snap-x">
        {professionals.length > 0 ? (
          professionals.map((member, index) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="min-w-[280px] sm:min-w-[320px] md:min-w-[400px] snap-start"
            >
              <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                {/* Selection Badge */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    member.selection_status === 'finalist' ? 'bg-primary text-white' :
                    member.selection_status === 'shortlisted' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {member.selection_status}
                  </span>
                </div>

                <div className="flex gap-3 sm:gap-5">
                  <div className="relative shrink-0">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-surface-container ring-2 sm:ring-4 ring-white shadow-sm flex items-center justify-center text-on-surface-variant">
                      {member.is_external ? (
                        <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 opacity-20" />
                      ) : (
                        <Image
                          src={member.professionals?.portfolio_photos?.[0] || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80"}
                          alt={member.is_external ? member.external_name || "" : member.professionals?.business_name || ""}
                          fill
                          sizes="(max-width: 768px) 64px, 80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    {member.selection_status === 'finalist' && (
                      <div className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center border-2 sm:border-4 border-white shadow-lg">
                        <Check className="text-white w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h5 className="font-headline font-bold text-sm sm:text-lg text-on-surface truncate max-w-[120px] sm:max-w-[150px] text-balance leading-tight">
                        {member.business_name}
                      </h5>
                      {member.is_external && (
                        <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-on-surface-variant/30" />
                      )}
                    </div>
                    <p className="text-[8px] sm:text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5 sm:mt-1 opacity-70">
                      {member.is_external ? member.external_category || areaName : member.professionals?.category}
                    </p>

                    {member.private_note && (
                      <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/5">
                        <p className="text-[8px] sm:text-[10px] text-on-surface-variant/80 leading-relaxed italic">
                          "{member.private_note}"
                        </p>
                      </div>
                    )}

                    <div className="mt-2 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                      <div className="flex items-center bg-surface-container px-1.5 sm:px-2 py-1 rounded-lg">
                        <span className="text-[8px] sm:text-[10px] font-bold text-on-surface-variant">Rang #{member.rank_order + 1}</span>
                      </div>
                      <div className="flex gap-0.5 sm:gap-1">
                         <button
                           onClick={() => handleRankUpdate(member.id, member.rank_order, 'up')}
                           disabled={member.rank_order === 0 || isUpdating}
                           className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-surface-container hover:bg-surface-container-high rounded-full disabled:opacity-30 transition-colors"
                           aria-label={`Augmenter le rang de ${member.is_external ? member.external_name : member.professionals?.business_name}`}
                         >
                           <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                         </button>
                         <button
                           onClick={() => handleRankUpdate(member.id, member.rank_order, 'down')}
                           disabled={isUpdating}
                           className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-surface-container hover:bg-surface-container-high rounded-full disabled:opacity-30 transition-colors"
                           aria-label={`Diminuer le rang de ${member.is_external ? member.external_name : member.professionals?.business_name}`}
                         >
                           <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1 flex gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleStatusUpdate(member.id, 'shortlisted')}
                      className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                        member.selection_status === 'shortlisted' ? 'bg-secondary-container text-on-secondary-container shadow-md' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(member.id, 'finalist')}
                      className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                        member.selection_status === 'finalist' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      Finaliser
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {member.is_external ? (
                      <button
                        onClick={() => setEditingMember({
                          id: member.id,
                          data: {
                            name: member.external_name || "",
                            phone: (member as any).external_phone || "",
                            category: member.external_category || areaName,
                            location: (member as any).external_location || "",
                            note: member.private_note || "",
                          }
                        })}
                        className="p-2 sm:p-2.5 text-on-surface-variant/40 hover:text-primary transition-colors"
                        title="Modifier ce contact"
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    ) : (
                      member.professionals?.slug && (
                        <Link
                          href={`/professionnels/${member.professionals.slug}`}
                          className="p-2 sm:p-2.5 text-on-surface-variant/40 hover:text-primary transition-colors"
                          title="Voir le profil"
                        >
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                      )
                    )}
                    <button
                      onClick={() => handleRemove(member)}
                      className="p-2 sm:p-2.5 text-on-surface-variant/40 hover:text-kelen-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="w-full py-8 sm:py-12 text-center bg-surface-container-low/50 rounded-xl sm:rounded-3xl border border-dashed border-outline-variant/30">
             <p className="text-on-surface-variant font-medium italic text-xs sm:text-sm">Aucun profil à comparer dans ce domaine.</p>
             <button
               onClick={() => setShowAddSearch(true)}
               className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-bold text-primary hover:underline flex items-center gap-1.5 sm:gap-2 mx-auto justify-center"
             >
               <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
               Trouver un pro
             </button>
          </div>
        )}
      </div>
      
      <AddProSearchDialog
        isOpen={showAddSearch}
        onClose={() => setShowAddSearch(false)}
        projectId={projectId}
        areaName={areaName}
        areaId={areaId}
        onSuccess={onRefresh}
      />

      <AddExternalProModal
        isOpen={showAddExternal}
        onClose={() => setShowAddExternal(false)}
        projectId={projectId}
        areaName={areaName}
        areaId={areaId}
        onSuccess={onRefresh}
      />

      <AddExternalProModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        projectId={projectId}
        areaName={areaName}
        areaId={areaId}
        onSuccess={() => { setEditingMember(null); onRefresh(); }}
        editLinkId={editingMember?.id}
        initialData={editingMember?.data}
      />
    </div>
  );
}
