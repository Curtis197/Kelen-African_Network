"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getProProjects, deleteProProject, updateProProjectStatus, toggleProProjectPublic } from "@/lib/actions/pro-projects";
import type { ProProject, ProProjectStatus } from "@/lib/types/pro-projects";
import {
  Plus, Trash2, Eye, EyeOff, Loader2,
  MapPin, Calendar, DollarSign, ImageIcon,
  CheckCircle, PauseCircle, XCircle, Construction,
  Grid3X3, List, ChevronDown
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const supabase = createClient();

  console.log('[ProProjectsPage] Render, state:', { viewMode, filter, projectCount: projects.length, isLoading });

  const loadProjects = useCallback(async () => {
    console.log('[ProProjectsPage] loadProjects started, filter:', filter);
    setIsLoading(true);
    const statusFilter = filter === "all" ? undefined : filter;
    const data = await getProProjects(statusFilter);
    console.log('[ProProjectsPage] loadProjects completed, projects loaded:', data?.length || 0, 'sample:', data?.[0] ? { id: data[0].id, is_collab: data[0].is_collaboration } : 'none');
    setProjects(data);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (statusDropdownOpen && !target.closest('[data-dropdown]')) {
        setStatusDropdownOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [statusDropdownOpen]);

  const handleStatusChange = async (id: string, status: ProProjectStatus) => {
    console.log('[ProProjectsPage] handleStatusChange, project:', id, 'new status:', status);
    const result = await updateProProjectStatus(id, status);
    if (result.error) {
      console.error('[ProProjectsPage] handleStatusChange error:', result.error);
      toast.error(result.error);
    } else {
      console.log('[ProProjectsPage] handleStatusChange success');
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[status].label}`);
      loadProjects();
    }
    setStatusDropdownOpen(null);
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

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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

        {/* View Mode Toggle - Desktop/Tablet Only */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-container rounded-xl p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            aria-label="Vue grille"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            aria-label="Vue liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
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
        <>
          {/* Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const statusConf = STATUS_CONFIG[project.status];
                return (
                  <div
                    key={project.id}
                    className="bg-surface-container-low rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
                  >
                    {(() => {
                      const featuredPhoto = project.images?.find(img => img.is_main)?.url || project.images?.[0]?.url;

                      if (featuredPhoto) {
                        return (
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-lowest rounded-t-2xl">
                            <Image
                              src={featuredPhoto}
                              alt={project.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow ${statusConf.color}`}>
                                {statusConf.icon}
                                {statusConf.label}
                              </span>
                              {project.is_collaboration && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 shadow">
                                  Collaboration
                                </span>
                              )}
                              {project.is_public && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 shadow">
                                  <Eye className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-lowest flex items-center justify-center rounded-t-2xl">
                          <ImageIcon className="w-12 h-12 text-on-surface-variant/20" />
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConf.color}`}>
                              {statusConf.icon}
                              {statusConf.label}
                            </span>
                            {project.is_collaboration && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                Collaboration
                              </span>
                            )}
                            {project.is_public && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                <Eye className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="p-4 space-y-3 rounded-b-2xl">
                      <h3 className="text-base font-semibold text-on-surface truncate">
                        {project.title}
                      </h3>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                        {project.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {project.location}
                          </span>
                        )}
                        {project.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {project.budget.toLocaleString('fr-FR')}
                          </span>
                        )}
                      </div>

                      {/* Status Dropdown */}
                      <div className="relative pt-2 border-t border-outline-variant/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusDropdownOpen(statusDropdownOpen === project.id ? null : project.id);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${statusConf.color}`}
                        >
                          <span className="flex items-center gap-1">
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${statusDropdownOpen === project.id ? 'rotate-180' : ''}`} />
                        </button>

                        {statusDropdownOpen === project.id && (
                          <div data-dropdown className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-outline-variant/20 overflow-hidden">
                            {(Object.keys(STATUS_CONFIG) as ProProjectStatus[]).map((status) => {
                              const conf = STATUS_CONFIG[status];
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(project.id, status)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-container transition-colors"
                                >
                                  {conf.icon}
                                  <span className="font-medium">{conf.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Quick actions */}
                      <div className="flex items-center justify-between pt-2">
                        <Link
                          href={`/pro/projets/${project.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Voir détails
                        </Link>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(project.id, project.title)}
                            className="p-1.5 text-red-600 rounded hover:bg-red-50 transition-colors"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-surface-container-low rounded-2xl">
              <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container-high/30 border-b border-outline-variant/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Projet</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Statut</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Détails</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {projects.map((project) => {
                    const statusConf = STATUS_CONFIG[project.status];
                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-surface-container-high/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {project.images?.[0]?.url ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                                <Image
                                  src={project.images[0].url}
                                  alt={project.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-6 h-6 text-on-surface-variant/30" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-on-surface truncate">
                                {project.title}
                                {project.is_collaboration && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                                    Collaboration
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                                {project.category && (
                                  <span className="capitalize">{project.category}</span>
                                )}
                                {project.client_name && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">Client: {project.client_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 hidden md:table-cell">
                          {/* Interactive Status Dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusDropdownOpen(statusDropdownOpen === project.id ? null : project.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusConf.color}`}
                            >
                              {statusConf.icon}
                              {statusConf.label}
                              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${statusDropdownOpen === project.id ? 'rotate-180' : ''}`} />
                            </button>

                            {statusDropdownOpen === project.id && (
                              <div data-dropdown className="absolute z-10 mt-2 w-48 bg-white rounded-lg shadow-lg border border-outline-variant/20 overflow-hidden">
                                {(Object.keys(STATUS_CONFIG) as ProProjectStatus[]).map((status) => {
                                  const conf = STATUS_CONFIG[status];
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => handleStatusChange(project.id, status)}
                                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-surface-container transition-colors ${
                                        project.status === status ? 'bg-primary/10 font-semibold' : ''
                                      }`}
                                    >
                                      {conf.icon}
                                      <span>{conf.label}</span>
                                      {project.status === status && (
                                        <CheckCircle className="w-3.5 h-3.5 ml-auto text-primary" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
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
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/pro/projets/${project.id}`}
                              className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
                              aria-label="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(project.id, project.title)}
                              className="p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
