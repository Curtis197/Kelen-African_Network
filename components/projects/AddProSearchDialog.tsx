"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { manageProjectProfessional } from "@/lib/actions/projects";
import { toast } from "sonner";
import { Search, X, User, Star, ShieldCheck, CheckCircle2, ChevronRight, Loader2, Plus } from "lucide-react";
import Image from "next/image";

interface Professional {
  id: string;
  business_name: string;
  owner_name: string;
  category: string;
  city: string;
  country: string;
  status: string;
  avg_rating: number;
  portfolio_photos: string[];
}

interface AddProSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  areaName: string;
  areaId?: string;
  onSuccess: () => void;
}

export function AddProSearchDialog({
  isOpen,
  onClose,
  projectId,
  areaName,
  areaId,
  onSuccess,
}: AddProSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Professional[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      const { data, error } = await supabase
        .from("professionals")
        .select("id, business_name, owner_name, category, city, country, status, avg_rating, portfolio_photos")
        .or(`business_name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%`)
        .neq("status", "black") // Don't show blacklisted pros
        .limit(10);

      if (error) {
        toast.error("Erreur lors de la recherche");
      } else {
        setResults(data || []);
      }
      setIsSearching(false);
    };

    const timer = setTimeout(() => {
      fetchResults();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const handleAddPro = async (pro: Professional) => {
    setIsAdding(pro.id);
    
    try {
      const result = await manageProjectProfessional(
        projectId,
        pro.id,
        areaName,
        'add',
        false,
        undefined,
        areaId
      );

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${pro.business_name} ajoutÃ© au projet`);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsAdding(null);
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
            className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[2.5rem] shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 shrink-0 border-b border-outline-variant/10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Appui Plateforme
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight">
                    Ajouter un professionnel
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-1">
                    Recherchez parmi nos experts vÃ©rifiÃ©s pour le domaine <span className="font-bold text-primary">{areaName}</span>.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SearchBar */}
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nom, entreprise, mÃ©tier..."
                  className="w-full bg-surface-container-low rounded-2xl pl-14 pr-6 py-5 font-headline font-bold text-on-surface border-none focus:ring-2 focus:ring-primary/20 placeholder:opacity-30 text-lg transition-all"
                />
                {isSearching && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
              {results.length > 0 ? (
                results.map((pro, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={pro.id}
                    onClick={() => !isAdding && handleAddPro(pro)}
                    className="group relative flex items-center gap-4 p-4 rounded-3xl bg-surface-container-low hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {/* Avatar */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/10">
                      {pro.portfolio_photos?.[0] ? (
                        <Image 
                          src={pro.portfolio_photos[0]} 
                          alt={pro.business_name}
                          fill
                          sizes="64px"
                          className="object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <User className="w-8 h-8 opacity-20" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-headline font-bold text-base text-on-surface truncate group-hover:text-primary transition-colors">
                          {pro.business_name}
                        </h4>
                        {pro.status === 'gold' && (
                          <ShieldCheck className="w-4 h-4 text-kelen-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant/60 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          {pro.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {pro.avg_rating || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-surface-container rounded-full text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      {isAdding === pro.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </div>
                  </motion.div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant/40">
                  <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8" />
                  </div>
                  <p className="font-headline font-bold">Aucun professionnel trouvÃ©</p>
                  <p className="text-sm mt-1">RÃ©essayez avec d'autres mots-clÃ©s</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant/30">
                  <p className="text-sm italic font-medium">Commencez Ã  taper pour rechercher...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-surface-container-low/50 border-t border-outline-variant/10 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium max-w-[280px]">
                  Tous ces professionnels sont vÃ©rifiÃ©s et suivis par nos Ã©quipes techniques pour garantir la qualitÃ©.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-surface-container text-on-surface font-headline font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
