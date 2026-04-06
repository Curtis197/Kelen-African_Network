"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin, Calendar, DollarSign, User } from "lucide-react";
import type { ProProject } from "@/lib/types/pro-projects";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProProjectDetailProps {
  project: ProProject;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: "En cours",
  completed: "Terminé",
  paused: "En pause",
  cancelled: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export function ProProjectDetail({ project }: ProProjectDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/pro/projets"
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
            aria-label="Retour aux projets"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
              {project.is_public && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Portfolio
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/pro/projets/${project.id}/journal`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" />
            Journal
          </Link>
          <Link
            href={`/pro/projets/${project.id}/edit`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-surface-container text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors"
          >
            Modifier
          </Link>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-surface-container-low rounded-2xl p-6">
          <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-low rounded-2xl p-5">
          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            Lieu
          </span>
          <p className="text-sm font-semibold text-on-surface">
            {project.location || "—"}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-5">
          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Dates
          </span>
          <p className="text-sm font-semibold text-on-surface">
            {project.start_date ? format(new Date(project.start_date), "d MMM yyyy", { locale: fr }) : "—"}
            {project.end_date ? ` → ${format(new Date(project.end_date), "d MMM yyyy", { locale: fr })}` : ""}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-5">
          <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Budget
          </span>
          <p className="text-sm font-semibold text-on-surface">
            {project.budget ? `${project.budget.toLocaleString('fr-FR')} ${project.currency}` : "—"}
          </p>
        </div>

        {project.client_name && (
          <div className="bg-surface-container-low rounded-2xl p-5">
            <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" />
              Client
            </span>
            <p className="text-sm font-semibold text-on-surface">{project.client_name}</p>
            {project.client_email && (
              <p className="text-xs text-on-surface-variant mt-1">{project.client_email}</p>
            )}
          </div>
        )}

        {project.actual_end_date && (
          <div className="bg-surface-container-low rounded-2xl p-5">
            <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Fin réelle
            </span>
            <p className="text-sm font-semibold text-on-surface">
              {format(new Date(project.actual_end_date), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        )}

        {project.completion_notes && (
          <div className="bg-surface-container-low rounded-2xl p-5 sm:col-span-2">
            <span className="text-xs font-medium text-on-surface-variant mb-2 block">
              Notes de fin
            </span>
            <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
              {project.completion_notes}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Placeholder */}
      <div className="bg-surface-container-low rounded-2xl p-6">
        <h3 className="text-base font-bold text-on-surface mb-4">Résumé du journal</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Rapports", value: "—" },
            { label: "Dépenses totales", value: "—" },
            { label: "Photos", value: "—" },
            { label: "Jours travaillés", value: "—" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
              <p className="text-xs text-on-surface-variant mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant/60 mt-4 text-center">
          Les statistiques seront disponibles après la création de rapports
        </p>
      </div>
    </div>
  );
}
