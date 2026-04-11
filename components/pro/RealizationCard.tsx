"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, ImageIcon, Edit2, Trash2, Loader2, Download } from "lucide-react";
import { deleteProjectDocument } from "@/lib/actions/realisations";
import { exportRealisationToPDF } from "@/lib/utils/pdf-export";
import { useState } from "react";
import type { ProjectDocument } from "@/lib/supabase/types";
import { toast } from "sonner";

interface ProjectDocumentCardProps {
  document: ProjectDocument;
}

export function ProjectDocumentCard({
  document: doc,
}: ProjectDocumentCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return;

    setIsDeleting(true);
    try {
      await deleteProjectDocument(doc.id);
      toast.success("Projet supprimé");
      router.refresh();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await exportRealisationToPDF(doc.id);
      toast.success('Export PDF lancé');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'export");
    }
  };

  const statusLabels: Record<string, string> = {
    pending_review: "En attente",
    published: "Publié",
    rejected: "Rejeté",
  };

  const statusColors: Record<string, string> = {
    pending_review: "bg-kelen-yellow-500/10 text-kelen-yellow-700",
    published: "bg-kelen-green-500/10 text-kelen-green-700",
    rejected: "bg-kelen-red-500/10 text-kelen-red-700",
  };

  const featuredPhoto = doc.images?.find(img => img.is_main)?.url || doc.images?.[0]?.url;
  const photoCount = doc.images?.length || 0;

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] bg-surface-container-lowest transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_-12px_rgba(26,28,28,0.04)] ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Image Preview */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-low">
        {featuredPhoto ? (
          <Image
            src={featuredPhoto}
            alt={doc.project_title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-on-surface-variant/20">
            <ImageIcon size={48} strokeWidth={1} />
          </div>
        ) }

        {/* Status Badge */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md ${statusColors[doc.status] || 'bg-surface/90 text-on-surface'}`}>
            {statusLabels[doc.status] || doc.status}
          </div>
          {photoCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-xs font-medium text-on-surface backdrop-blur-md">
              <ImageIcon size={12} />
              {photoCount}
            </div>
          )}
        </div>

        {/* Action Menu */}
        <div className="absolute top-4 right-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
           <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-on-surface shadow-sm hover:bg-white transition-colors"
                aria-label={`Exporter ${doc.project_title} en PDF`}
              >
                <Download size={14} />
              </button>
              <Link
                href={`/pro/realisations/${doc.id}/edit`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-on-surface shadow-sm hover:bg-white transition-colors"
                aria-label={`Modifier ${doc.project_title}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Edit2 size={14} />
              </Link>
              <button
                onClick={handleDelete}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-kelen-red-600 shadow-sm hover:bg-white transition-colors"
                aria-label={`Supprimer ${doc.project_title}`}
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
            {doc.project_title}
          </h3>
        </div>

        <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-on-surface-variant/80">
          {doc.project_description || "Aucune description fournie."}
        </p>

        {/* Footer Metadata */}
        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-transparent pt-4">
          {doc.project_date && (
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Calendar size={14} className="text-kelen-yellow-700" />
              {new Date(doc.project_date).toLocaleDateString('fr-FR', {
                month: 'short',
                year: 'numeric'
              })}
            </div>
          )}
          {doc.project_amount && (
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(doc.project_amount)}
            </div>
          )}
        </div>
      </div>
    
      {/* Click layer */}
      <Link 
        href={`/pro/realisations/${doc.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Voir les détails de ${doc.project_title}`}
      />
    </div>
  );
}
