"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProProjects, deleteProProject, updateProProjectStatus, toggleProProjectPublic } from "@/lib/actions/pro-projects";
import type { ProProject, ProProjectStatus } from "@/lib/types/pro-projects";
import {
  Plus, Trash2, Eye, EyeOff, Loader2,
  MapPin, Calendar, DollarSign,
  CheckCircle, PauseCircle, XCircle, Construction
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<ProProjectStatus, { label: string; icon: React.ReactNode; color: string }> = {
  in_progress: {
    label: "En cours",
    icon: <Construction className="w-3.5 h-3.5" />,
    color: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Terminé",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: "bg-green-100 text-green-700",
  },
  paused: {
    label: "En pause",
    icon: <PauseCircle className="w-3.5 h-3.5" />,
    color: "bg-amber-100 text-amber-700",
  },
  cancelled: {
    label: "Annulé",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "bg-red-100 text-red-700",
  },
};

export function ProProjectsPage() {
  const [projects, setProjects] = useState<ProProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    const statusFilter = filter === "all" ? undefined : filter;
    const data = await getProProjects(statusFilter);
    setProjects(data);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleStatusChange = async (id: string, status: ProProjectStatus) => {
    const result = await updateProProjectStatus(id, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[status].label}`);
      loadProjects();
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer le projet "${title}" ?`)) return;
    const result = await deleteProProject(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Projet supprimé");
      loadProjects();
    }
  };

  const togglePublic = async (project: ProProject) => {
    const result = await toggleProProjectPublic(project.id, !project.is_public);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(project.is_public ? "Projet retiré du portfolio" : "Projet ajouté au portfolio");
      loadProjects();
    }
  };

  const filters = [
    { value: "all", label: "Tous" },
    { value: "in_progress", label: "En cours" },
    { value: "completed", label: "Terminés" },
    { value: "paused", label: "En pause" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Mes projets</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Gérez vos projets et ajoutez-les à votre portfolio
          </p>
        </div>
        <Link
          href="/pro/projets/nouveau"
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity w-fit"
        >
          <Plus className="w-4 h-4" />
          Nouveau projet
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-low rounded-2xl p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl">
          <Construction className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="text-lg font-semibold text-on-surface mb-2">Aucun projet</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            Créez votre premier projet pour commencer à documenter votre travail
          </p>
          <Link
            href="/pro/projets/nouveau"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Créer un projet
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const statusConf = STATUS_CONFIG[project.status];
            return (
              <div
                key={project.id}
                className="bg-surface-container-low rounded-2xl p-5 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConf.color}`}>
                        {statusConf.icon}
                        {statusConf.label}
                      </span>
                      {project.is_public && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <Eye className="w-3 h-3" />
                          Portfolio
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-on-surface truncate">
                      {project.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pro/projets/${project.id}`}
                      className="px-3 py-2 text-sm bg-surface-container text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
                    >
                      Voir détails
                    </Link>
                    <button
                      onClick={() => togglePublic(project)}
                      className="p-2 text-on-surface-variant hover:text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors"
                      aria-label={project.is_public ? "Retirer du portfolio" : "Ajouter au portfolio"}
                      title={project.is_public ? "Retirer du portfolio" : "Ajouter au portfolio"}
                    >
                      {project.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.title)}
                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-on-surface-variant">
                  {project.category && (
                    <span className="capitalize">{project.category}</span>
                  )}
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {project.location}
                    </span>
                  )}
                  {project.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.start_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {project.budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {project.budget.toLocaleString('fr-FR')} {project.currency}
                    </span>
                  )}
                  {project.client_name && (
                    <span className="text-on-surface-variant/60">
                      Client : {project.client_name}
                    </span>
                  )}
                </div>

                {/* Status change */}
                {project.status !== 'completed' && (
                  <div className="flex gap-2 pt-2 border-t border-outline-variant/10">
                    <button
                      onClick={() => handleStatusChange(project.id, 'completed')}
                      className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Marquer comme terminé
                    </button>
                    {project.status !== 'paused' && (
                      <button
                        onClick={() => handleStatusChange(project.id, 'paused')}
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        Mettre en pause
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
