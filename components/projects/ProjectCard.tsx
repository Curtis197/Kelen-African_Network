"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, CreditCard, Edit, ChevronRight, Home, PencilRuler } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  en_preparation: { label: "Brouillon", color: "bg-surface-container-high text-on-surface-variant" },
  en_cours: { label: "En cours", color: "bg-secondary-container text-on-secondary-container" },
  en_pause: { label: "En pause", color: "bg-error-container/20 text-error" },
  termine: { label: "Terminé", color: "bg-primary-container text-on-primary-container" },
  annule: { label: "Annulé", color: "bg-surface-variant text-on-surface-variant" },
};

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    category: string;
    location_formatted?: string;
    location: string;
    status: string;
    budget_total: number;
    budget_currency: string;
  };
  imageUrl?: string;
  index: number;
  onEdit: (id: string) => void;
}

export function ProjectCard({ project, imageUrl, index, onEdit }: ProjectCardProps) {
  console.log('[COMPONENT] Rendering ProjectCard:', { id: project.id, index });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/projets/${project.id}`}
        className="group bg-surface-container-lowest p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 lg:gap-6 hover:shadow-2xl hover:shadow-surface-container-high/50 transition-all duration-300 border border-transparent hover:border-surface-container"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 bg-surface-container-low">
          {imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={project.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {(project.category || '').toLowerCase() === 'construction' ? (
                <Home className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-on-surface-variant opacity-40" />
              ) : (
                <PencilRuler className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-on-surface-variant opacity-40" />
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <h4 className="font-headline font-bold text-base sm:text-lg text-on-surface truncate">
              {project.title}
            </h4>
            <span className={cn(
              "px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded-full uppercase tracking-wider flex-shrink-0",
              STATUS_CONFIG[project.status]?.color || "bg-surface-container text-on-surface-variant"
            )}>
              {STATUS_CONFIG[project.status]?.label || project.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-on-surface-variant">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="text-sm flex-shrink-0" />
              <span className="truncate">{project.location_formatted || project.location}</span>
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="text-sm flex-shrink-0" />
              <span>{project.budget_total.toLocaleString()} {project.budget_currency}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(project.id);
            }}
            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-colors"
            title="Modifier"
          >
            <Edit className="text-base" />
          </button>
          <div className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
            <ChevronRight />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
