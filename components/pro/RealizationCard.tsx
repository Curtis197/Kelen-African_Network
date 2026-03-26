import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, FileText, ImageIcon, Edit2, Trash2, Loader2 } from "lucide-react";
import { deleteRealization } from "@/lib/actions/realisations";
import { useState } from "react";
import type { ProfessionalRealization } from "@/lib/supabase/types";

interface RealizationCardProps {
  realization: ProfessionalRealization;
  mainImage?: string;
  imagesCount: number;
  documentsCount: number;
}

export function RealizationCard({
  realization,
  mainImage,
  imagesCount,
  documentsCount,
}: RealizationCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réalisation ?")) return;

    setIsDeleting(true);
    try {
      await deleteRealization(realization.id);
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] bg-surface-container-lowest transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(26,28,28,0.04)] ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Image Preview */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-low">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={realization.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-on-surface-variant/20">
            <ImageIcon size={48} strokeWidth={1} />
          </div>
        ) }
        
        {/* Badges Overlay */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {imagesCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-on-surface backdrop-blur-md">
              <ImageIcon size={12} />
              {imagesCount}
            </div>
          )}
          {documentsCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-on-surface backdrop-blur-md">
              <FileText size={12} />
              {documentsCount}
            </div>
          )}
        </div>

        {/* Action Menu (Hidden by default, visible on hover) */}
        <div className="absolute top-4 right-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
           <div className="flex gap-2">
              <Link 
                href={`/pro/realisations/${realization.id}/edit`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-on-surface shadow-sm hover:bg-white transition-colors"
                title="Modifier"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit2 size={14} />
              </Link>
              <button 
                onClick={handleDelete}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-kelen-red-600 shadow-sm hover:bg-white transition-colors"
                title="Supprimer"
              >
                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-headline text-lg font-bold leading-tight text-on-surface">
            {realization.title}
          </h3>
        </div>

        <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-on-surface-variant/80">
          {realization.description || "Aucune description fournie."}
        </p>

        {/* Footer Metadata */}
        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-transparent pt-4">
          {realization.location && (
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <MapPin size={14} className="text-kelen-green-600" />
              {realization.location}
            </div>
          )}
          {realization.completion_date && (
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Calendar size={14} className="text-kelen-yellow-700" />
              {new Date(realization.completion_date).toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>
    
      {/* Click layer */}
      <Link 
        href={`/pro/realisations/${realization.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Voir les détails de ${realization.title}`}
      />
    </div>
  );
}

