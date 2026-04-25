"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatRating } from "@/lib/utils/format";
import type { ProfessionalStatus } from "@/lib/supabase/types";
import { manageProjectProfessional } from "@/lib/actions/projects";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ProfessionalCardProps {
  id: string;
  slug: string;
  businessName: string;
  ownerName: string;
  category: string;
  city: string;
  country: string;
  status: ProfessionalStatus;
  recommendationCount: number;
  signalCount: number;
  avgRating: number | null;
  reviewCount: number;
  profilePictureUrl?: string | null;
  customDomain?: string | null;
  selectionContext?: {
    projectId: string;
    areaName: string;
  };
}

export function ProfessionalCard({
  id,
  slug,
  businessName,
  ownerName,
  category,
  city,
  country,
  status,
  recommendationCount,
  signalCount,
  avgRating,
  reviewCount,
  profilePictureUrl,
  customDomain,
  selectionContext,
}: ProfessionalCardProps) {
  const router = useRouter();
  console.log('[COMPONENT] ProfessionalCard render:', {
    slug,
    businessName,
    hasCustomDomain: !!customDomain,
    customDomain,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToProject = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectionContext || isAdding || added) return;

    setIsAdding(true);
    try {
      const result = await manageProjectProfessional(
        selectionContext.projectId,
        id,
        selectionContext.areaName,
        'add',
        false
      );
      if (result && 'error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      setAdded(true);
      setTimeout(() => {
        router.push(`/projets/${selectionContext.projectId}`);
      }, 1500);
    } catch (error) {
      console.error("Failed to add professional:", error);
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };
  const destination = customDomain
    ? `https://${customDomain}`
    : `/professionnels/${slug}`;

  const handleCardClick = () => {
    console.log('[COMPONENT] ProfessionalCard click:', {
      slug,
      hasCustomDomain: !!customDomain,
      destination,
    });
    if (customDomain) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    } else {
      router.push(destination);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group block cursor-pointer rounded-[1.5rem] sm:rounded-[2rem] bg-surface-container-lowest p-5 sm:p-8 transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] hover:-translate-y-2 hover:ring-1 hover:ring-kelen-green-100/50 relative overflow-hidden ring-1 ring-outline-variant/10"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Voir le site de ${businessName}`}
    >
      {added && (
        <div className="absolute inset-0 bg-kelen-green-600/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <Check className="w-12 h-12 mb-4 animate-bounce" />
          <p className="font-black uppercase tracking-widest text-[10px]">Ajouté au projet !</p>
          <p className="text-white/60 text-[9px] mt-2">Redirection...</p>
        </div>
      )}

      <div className="mb-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container ring-2 ring-outline-variant/20 flex items-center justify-center text-on-surface-variant">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt={businessName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-black text-on-surface-variant/30">
              {businessName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-foreground group-hover:text-kelen-green-500">
            {businessName}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ownerName}
          </p>
        </div>
        <StatusBadge
          status={status}
          recommendationCount={recommendationCount}
          signalCount={signalCount}
          avgRating={avgRating}
          size="sm"
          showDetails={false}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>{category}</span>
        <span className="text-border">·</span>
        <span>{city}, {country}</span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        {recommendationCount > 0 && (
          <span className="text-kelen-green-700">
            {recommendationCount} projet{recommendationCount > 1 ? "s" : ""} vérifié{recommendationCount > 1 ? "s" : ""}
          </span>
        )}
        {signalCount > 0 && (
          <span className="text-kelen-red-700">
            {signalCount} signal{signalCount > 1 ? "s" : ""}
          </span>
        )}
        {avgRating !== null && (
          <span className="text-muted-foreground">
            ★ {formatRating(avgRating)} ({reviewCount} avis)
          </span>
        )}
        {recommendationCount === 0 && signalCount === 0 && (
          <span className="text-muted-foreground">
            Aucun historique documenté
          </span>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 group-hover:text-kelen-green-600 transition-colors">
            Voir le profil
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-outline-variant group-hover:bg-kelen-green-400 transition-colors" />
        </div>

        {selectionContext && (
          <button
            onClick={handleAddToProject}
            disabled={isAdding || added}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              added ? 'bg-kelen-green-100 text-kelen-green-700' : 
              'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
            }`}
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : added ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {added ? 'Ajouté' : 'Choisir'}
          </button>
        )}
      </div>
    </div>
  );
}
