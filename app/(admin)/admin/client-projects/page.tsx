"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FolderOpen, Edit, Save, X, Search, MapPin, Calendar, DollarSign, Eye } from "lucide-react";
import Link from "next/link";


interface UserProject {
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  location_formatted?: string;
  status: "en_preparation" | "en_cours" | "en_pause" | "termine" | "annule";
  budget_total: number;
  budget_currency: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  objectives?: any[];
}

const STATUS_CONFIG = {
  en_preparation: { label: "Brouillon", color: "bg-stone-100 text-stone-700 border-stone-300" },
  en_cours: { label: "En cours", color: "bg-blue-50 text-blue-700 border-blue-200" },
  en_pause: { label: "En pause", color: "bg-orange-50 text-orange-700 border-orange-200" },
  termine: { label: "TerminÃ©", color: "bg-green-50 text-green-700 border-green-200" },
  annule: { label: "AnnulÃ©", color: "bg-red-50 text-red-700 border-red-200" },
};

const CATEGORIES = [
  "Construction",
  "RÃ©novation",
  "Architecture",
  "Design",
  "IngÃ©nierie",
  "Ã‰lectricitÃ©",
  "Plomberie",
  "Peinture",
  "Menuiserie",
  "Jardinage",
  "Autre",
];

const CURRENCIES = ["EUR", "XOF", "USD"];

export default function ClientProjectsAdminPage() {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<UserProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProject, setEditingProject] = useState<UserProject | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProject>>({});
  const supabase = createClient();


  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const fetchProjects = async () => {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Non authentifiÃ©");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .order("created_at", { ascending: false });


    if (error?.code === '42501') {
      toast.error("AccÃ¨s refusÃ© - Contactez un super-admin");
    } else if (error) {
      toast.error("Erreur lors du chargement");
    } else {
      setProjects(data || []);
      setFilteredProjects(data || []);
    }

    setIsLoading(false);
  };

  const startEditing = (project: UserProject) => {
    setEditingProject(project);
    setEditForm({ ...project });
  };

  const cancelEditing = () => {
    setEditingProject(null);
    setEditForm({});
  };

  const saveProject = async () => {
    if (!editingProject) return;


    const { error } = await supabase
      .from("user_projects")
      .update({
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        location: editForm.location,
        location_formatted: editForm.location_formatted,
        status: editForm.status,
        budget_total: editForm.budget_total,
        budget_currency: editForm.budget_currency,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        objectives: editForm.objectives,
      })
      .eq("id", editingProject.id);


    if (error?.code === '42501') {
      toast.error("Modification refusÃ©e - AccÃ¨s non autorisÃ©");
    } else if (error) {
      toast.error("Erreur lors de la modification");
    } else {
      toast.success("Projet modifiÃ© avec succÃ¨s");
      setEditingProject(null);
      setEditForm({});
      fetchProjects();
    }
  };

  const updateEditField = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "â€”";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-kelen-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projets Clients</h1>
            <p className="text-sm text-muted-foreground">
              Administration de tous les projets utilisateurs
            </p>
          </div>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-surface-container text-foreground rounded-lg hover:bg-surface-container-high transition-colors text-sm font-medium"
        >
          â† Retour
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">Total projets</p>
          <p className="text-2xl font-bold text-foreground mt-1">{projects.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">En cours</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {projects.filter((p) => p.status === "en_cours").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">TerminÃ©s</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {projects.filter((p) => p.status === "termine").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">En pause</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {projects.filter((p) => p.status === "en_pause").length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
          />
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="space-y-4">
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {editingProject?.id === project.id ? (
                // Edit Mode
                <div className="rounded-xl border-2 border-kelen-green-500 bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-kelen-green-50 to-green-50/30 p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">Modifier le projet</h3>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Titre du projet *
                      </label>
                      <input
                        type="text"
                        value={editForm.title || ""}
                        onChange={(e) => updateEditField("title", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Description
                      </label>
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => updateEditField("description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                      />
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          CatÃ©gorie
                        </label>
                        <select
                          value={editForm.category || ""}
                          onChange={(e) => updateEditField("category", e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                        >
                          <option value="">Non dÃ©finie</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Statut
                        </label>
                        <select
                          value={editForm.status || "en_preparation"}
                          onChange={(e) => updateEditField("status", e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Localisation
                      </label>
                      <input
                        type="text"
                        value={editForm.location || ""}
                        onChange={(e) => updateEditField("location", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                      />
                    </div>

                    {/* Budget & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Budget total
                        </label>
                        <input
                          type="number"
                          value={editForm.budget_total || 0}
                          onChange={(e) => updateEditField("budget_total", Number(e.target.value))}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Devise
                        </label>
                        <select
                          value={editForm.budget_currency || "EUR"}
                          onChange={(e) => updateEditField("budget_currency", e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                        >
                          {CURRENCIES.map((curr) => (
                            <option key={curr} value={curr}>
                              {curr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Date de dÃ©but
                        </label>
                        <input
                          type="date"
                          value={editForm.start_date?.split("T")[0] || ""}
                          onChange={(e) => updateEditField("start_date", e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Date de fin
                        </label>
                        <input
                          type="date"
                          value={editForm.end_date?.split("T")[0] || ""}
                          onChange={(e) => updateEditField("end_date", e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 p-4 bg-surface-container-low border-t border-border">
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                    <button
                      onClick={saveProject}
                      className="px-4 py-2 bg-kelen-green-600 text-white rounded-lg hover:bg-kelen-green-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="rounded-xl border border-border bg-white overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-foreground truncate">
                            {project.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG]?.color
                            }`}
                          >
                            {STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG]?.label}
                          </span>
                        </div>

                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {project.category && (
                            <div className="flex items-center gap-1.5">
                              <FolderOpen className="w-4 h-4" />
                              <span>{project.category}</span>
                            </div>
                          )}
                          {project.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span>{project.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              {project.budget_total.toLocaleString()} {project.budget_currency}
                            </span>
                          </div>
                          {project.start_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(project.start_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/projets/${project.id}`}
                          className="p-2 hover:bg-surface-container rounded-lg text-muted-foreground hover:text-kelen-green-600 transition-colors"
                          title="Voir le projet"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => startEditing(project)}
                          className="p-2 hover:bg-surface-container rounded-lg text-muted-foreground hover:text-kelen-green-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-foreground">Aucun projet trouvÃ©</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery
              ? "Essayez avec d'autres termes de recherche"
              : "Aucun projet client n'a Ã©tÃ© trouvÃ©"}
          </p>
        </div>
      )}
    </div>
  );
}
