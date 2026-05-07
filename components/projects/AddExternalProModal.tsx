"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { manageProjectProfessional, updateExternalProfessional } from "@/lib/actions/projects";
import { toast } from "sonner";
import { LocationSearch, type LocationData } from "@/components/location/LocationSearch";
import { X, Globe } from "lucide-react";

interface AddExternalProModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  areaName: string;
  areaId?: string;
  onSuccess: () => void;
  editLinkId?: string;
  initialData?: { name: string; phone: string; category: string; location: string; note: string };
}

export function AddExternalProModal({ isOpen, onClose, projectId, areaName, areaId, onSuccess, editLinkId, initialData }: AddExternalProModalProps) {
  const isEditMode = !!editLinkId;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    name: "",
    phone: "",
    category: areaName,
    location: "",
    note: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { name: "", phone: "", category: areaName, location: "", note: — });
    }
  }, [isOpen, editLinkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Le nom est requis");
      return;
    }

    setIsSaving(true);
    try {
      let result;
      if (isEditMode && editLinkId) {
        result = await updateExternalProfessional(editLinkId, projectId, {
          name: formData.name,
          phone: formData.phone,
          category: formData.category,
          location: formData.location,
          note: formData.note,
        });
      } else {
        result = await manageProjectProfessional(
          projectId,
          null,
          areaName,
          'add',
          true,
          {
            name: formData.name,
            phone: formData.phone,
            category: formData.category,
            location: formData.location,
            note: formData.note
          },
          areaId
        );
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditMode ? "Professionnel externe mis à jour" : "Professionnel externe ajouté");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-surface-container-lowest rounded-[2.5rem] shadow-2xl overflow-hidden border border-outline-variant/30"
          >
            <div className="p-8 lg:p-12">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">
                    <Globe className="text-sm" />
                    Contact Externe
                  </div>
                  <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">{isEditMode ? "Modifier l'expert" : "Ajouter un expert"}</h2>
                  <p className="text-on-surface-variant text-sm mt-1">{isEditMode ? "Mettez à jour les informations de ce contact externe." : "Enregistrez un professionnel qui n'est pas encore sur la plateforme."}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-4">Nom de l'expert / Entreprise</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Cabinet Architecture Sow"
                    className="w-full bg-surface-container-low rounded-2xl px-6 py-4 font-headline font-bold text-on-surface border-none focus:ring-2 focus:ring-primary/20 placeholder:opacity-30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-4">Domaine</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-surface-container-low rounded-2xl px-6 py-4 font-headline font-bold text-on-surface border-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-4">Localisation</label>
                    <LocationSearch
                      value={formData.location ? { name: formData.location, formatted_address: formData.location, lat: 0, lng: 0 } : null}
                      onChange={(loc: LocationData | null) => setFormData({ ...formData, location: loc?.formatted_address || — })}
                      placeholder="Dakar, Sénégal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-4">Téléphone / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+221 ..."
                    className="w-full bg-surface-container-low rounded-2xl px-6 py-4 font-headline font-bold text-on-surface border-none focus:ring-2 focus:ring-primary/20 placeholder:opacity-30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-4">Note / Commentaire privé</label>
                  <textarea
                    rows={3}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Détails personnels, recommandations, points d'attention..."
                    className="w-full bg-surface-container-low rounded-2xl px-6 py-4 font-body font-medium text-on-surface border-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:opacity-30"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 bg-surface-container text-on-surface font-headline font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-surface-container-high transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-4 bg-primary text-white font-headline font-bold uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Enregistrement..." : isEditMode ? "Enregistrer les modifications" : "Ajouter au projet"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
