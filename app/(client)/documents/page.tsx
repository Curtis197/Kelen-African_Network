"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import Link from "next/link";
import Image from "next/image";
import { Upload, FileText, Eye, Download, Trash2, Grid3X3, List, FolderOpen, ShieldCheck, X, Archive } from "lucide-react";

interface ProjectDocument {
  id: string;
  project_id: string;
  project_title: string;
  contract_url: string;
  created_at: string;
}

interface UserProject {
  id: string;
  title: string;
}

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
    fetchDocuments();
  }, []);

  const fetchProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_projects")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setProjects((data as UserProject[]) || []);
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: projectsData } = await supabase
      .from("user_projects")
      .select("id")
      .eq("user_id", user.id);

    if (!projectsData || projectsData.length === 0) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from("project_documents")
      .select("*")
      .in("project_id", projectsData.map(p => p.id))
      .order("created_at", { ascending: false });

    if (data) setDocuments((data as ProjectDocument[]) || []);
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 10 Mo.");
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non accepté. Formats acceptés : PDF, JPG, PNG.");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Vous devez être connecté pour uploader un document."); return; }

      const projectId = selectedProject !== "all" ? selectedProject : null;
      if (!projectId) {
        toast.error("Veuillez sélectionner un projet avant d'uploader un document.");
        setIsUploading(false);
        return;
      }

      const fileUrl = await uploadFile(file, 'portfolios', `${user.id}/documents`);

      const { error } = await supabase.from("project_documents").insert({
        project_id: projectId,
        project_title: file.name.split('.')[0],
        contract_url: fileUrl,
      });

      if (error) {
        toast.error(error.code === '42501'
          ? "Erreur de permissions. Veuillez contacter le support."
          : "Erreur lors de l'enregistrement du document.");
        return;
      }

      toast.success("Document uploadé avec succès !");
      fetchDocuments();
    } catch {
      toast.error("Erreur lors de l'upload du document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (docId: string) => {
    toast("Supprimer ce document ?", {
      action: {
        label: "Supprimer",
        onClick: async () => {
          const { error } = await supabase.from("project_documents").delete().eq("id", docId);
          if (error) { toast.error("Erreur lors de la suppression du document."); return; }
          fetchDocuments();
          if (selectedDoc?.id === docId) setSelectedDoc(null);
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || "Document sans projet";
  };

  const filteredDocuments = selectedProject === "all"
    ? documents
    : documents.filter(doc => doc.project_id === selectedProject);

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-7xl w-full px-3 sm:px-4 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-on-surface-variant mb-6 sm:mb-8">
          <Link href="/projets" className="hover:text-primary transition-colors truncate flex-shrink-0">
            <span className="hidden xs:inline">Mes Projets</span>
            <span className="xs:hidden">Projets</span>
          </Link>
          <span className="opacity-30 flex-shrink-0">/</span>
          <span className="text-primary truncate">Documents</span>
        </nav>

        {/* ── Header ──────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 flex-shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Mes Documents</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Coffre-fort numérique — tous vos documents de projet
            </p>
          </div>
        </div>

        {/* Project Filter */}
        {projects.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <FolderOpen className="w-4 h-4 text-on-surface-variant" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="flex-1 sm:flex-none px-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les projets</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Zone */}
        <div className="relative group border-2 border-dashed border-outline-variant/30 rounded-2xl p-8 sm:p-12 bg-surface-container-low hover:bg-primary/5 hover:border-primary transition-all text-center mb-8">
          <div className="w-16 h-16 bg-surface-container rounded-full shadow-inner flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
            {isUploading ? (
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
            )}
          </div>
          <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Déposez vos documents ici</h3>
          <p className="text-sm text-on-surface-variant mb-4 italic">
            Chiffrement AES-256 de bout en bout. Formats acceptés : PDF, JPG, PNG (Max 10Mo).
          </p>
          {selectedProject === "all" ? (
            <div className="px-6 py-3 bg-surface-container text-on-surface-variant/60 rounded-xl font-headline font-bold text-sm text-center">
              ⚠️ Sélectionnez un projet pour uploader
            </div>
          ) : (
            <button className="px-6 py-3 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all pointer-events-none">
              SÉLECTIONNER FICHIER
            </button>
          )}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleUpload}
            disabled={isUploading || selectedProject === "all"}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Fichiers ({filteredDocuments.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Documents Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-low rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-2xl">
            <FileText className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
            <h3 className="text-lg font-headline font-bold text-on-surface mb-2">Aucun document</h3>
            <p className="text-sm text-on-surface-variant">
              Uploadez votre premier document
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`group cursor-pointer bg-surface-container-low rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${
                  selectedDoc?.id === doc.id
                    ? 'border-primary shadow-lg'
                    : 'border-transparent hover:border-outline-variant/30'
                }`}
              >
                <div className="aspect-[4/3] bg-surface-container relative overflow-hidden flex items-center justify-center">
                  {(() => {
                    const cleanUrl = doc.contract_url?.trim() || "";
                    if (/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(cleanUrl) && !imgErrors.has(doc.id)) {
                      return (
                        <Image
                          src={cleanUrl}
                          alt={doc.project_title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={() => setImgErrors(prev => new Set([...prev, doc.id]))}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      );
                    }
                    if (/\.pdf(\?.*)?$/i.test(cleanUrl)) {
                      return (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-12 h-12 text-red-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">PDF</span>
                        </div>
                      );
                    }
                    return <FileText className="w-12 h-12 text-on-surface-variant/30" />;
                  })()}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm text-on-surface truncate mb-1">
                    {doc.project_title}
                  </p>
                  <p className="text-xs text-on-surface-variant mb-1">
                    {getProjectTitle(doc.project_id)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container border-b border-outline-variant/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Projet
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`group cursor-pointer transition-colors ${
                      selectedDoc?.id === doc.id
                        ? 'bg-primary/5'
                        : 'hover:bg-surface-container'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-on-surface-variant/40" />
                        <div>
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {doc.project_title}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {doc.contract_url.split('.').pop()?.toUpperCase() || 'FILE'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/projets/${doc.project_id}/documents`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-primary hover:underline"
                      >
                        {getProjectTitle(doc.project_id)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(doc.contract_url, '_blank');
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
                          title="Ouvrir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(doc.contract_url, '_blank');
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Document Detail Panel */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSelectedDoc(null)}
            />
            <div className="relative w-96 bg-surface shadow-2xl overflow-y-auto border-l border-outline-variant/20">
              <div className="sticky top-0 bg-surface border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-headline font-bold text-on-surface">Détails du document</h2>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 hover:bg-surface-container rounded-lg transition-colors"
                >
                  <X />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Preview */}
                <div className="bg-surface-container rounded-xl p-4">
                  <div className="aspect-square bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center mb-4 relative group">
                    {(() => {
                      const cleanUrl = selectedDoc.contract_url?.trim() || "";
                      if (/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(cleanUrl) && !imgErrors.has(selectedDoc.id)) {
                        return (
                          <Image
                            src={cleanUrl}
                            alt={selectedDoc.project_title}
                            fill
                            className="object-cover"
                            onError={() => setImgErrors(prev => new Set([...prev, selectedDoc.id]))}
                            sizes="400px"
                          />
                        );
                      }
                      if (/\.pdf(\?.*)?$/i.test(cleanUrl)) {
                        return (
                          <iframe
                            src={`${cleanUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-full border-0 pointer-events-none"
                            title="PDF Preview"
                          />
                        );
                      }
                      return <FileText className="w-16 h-16 text-on-surface-variant/30" />;
                    })()}
                  </div>
                  <h4 className="font-semibold text-sm text-on-surface truncate mb-2 px-2">
                    {selectedDoc.project_title}
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-2 px-2">
                    {getProjectTitle(selectedDoc.project_id)}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10 pb-2">
                    Métadonnées
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Créé le</span>
                      <span className="font-medium text-on-surface">
                        {new Date(selectedDoc.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Type</span>
                      <span className="font-medium text-on-surface uppercase">
                        {selectedDoc.contract_url.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Sécurité</span>
                      <span className="font-medium text-primary flex items-center gap-1">
                        <ShieldCheck className="text-sm" />
                        AES-256
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                  <Link
                    href={`/projets/${selectedDoc.project_id}/documents`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-surface-container text-on-surface rounded-xl font-headline font-bold text-sm hover:bg-surface-container-high transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Voir tous les documents du projet
                  </Link>
                  <a
                    href={selectedDoc.contract_url}
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-on-primary rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    <Eye className="w-4 h-4" />
                    Ouvrir le document
                  </a>
                  <button
                    onClick={() => handleDelete(selectedDoc.id)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 rounded-xl font-headline font-bold text-sm hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
