"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Upload, FileText, Eye, Download, Trash2, Filter, Grid3X3, List } from "lucide-react";

interface ProjectDocument {
  id: string;
  project_title: string;
  project_date: string;
  status: "pending_review" | "published" | "rejected";
  contract_url: string;
  created_at: string;
}

export default function ProProjectDocumentsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const supabase = createClient();

  console.log("[ProjectDocuments] Page mounted, projectId:", projectId);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchDocuments();
    }
  }, [projectId]);

  const fetchProject = async () => {
    console.log("[ProjectDocuments] Fetching project details for:", projectId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[ProjectDocuments] No user authenticated");
      return;
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      console.error("[ProjectDocuments] No professional profile found");
      return;
    }

    const { data: project, error } = await supabase
      .from("pro_projects")
      .select("title")
      .eq("id", projectId)
      .eq("professional_id", pro.id)
      .single();

    if (error) {
      console.error("[ProjectDocuments] Error fetching project:", error);
      return;
    }

    console.log("[ProjectDocuments] Project fetched:", project);
    setProjectTitle(project?.title || "Projet");
  };

  const fetchDocuments = async () => {
    console.log("[ProjectDocuments] Fetching documents for project:", projectId);
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[ProjectDocuments] No user authenticated");
      setIsLoading(false);
      return;
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      console.error("[ProjectDocuments] No professional profile found");
      setIsLoading(false);
      return;
    }

    console.log("[ProjectDocuments] Professional ID:", pro.id);

    const { data, error } = await supabase
      .from("project_documents")
      .select("*")
      .eq("professional_id", pro.id)
      .eq("pro_project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ProjectDocuments] Error fetching documents:", error);
      if (error.code === '42501') {
        console.error('[ProjectDocuments] [RLS] ❌ RLS POLICY VIOLATION - project_documents table');
        console.error('[ProjectDocuments] [RLS] User ID:', user.id);
        console.error('[ProjectDocuments] [RLS] Professional ID:', pro.id);
        console.error('[ProjectDocuments] [RLS] Fix: Check SELECT policy on project_documents table');
      }
    } else {
      console.log("[ProjectDocuments] Documents fetched:", data?.length || 0);
      setDocuments((data as ProjectDocument[]) || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[ProjectDocuments] No file selected");
      return;
    }

    console.log("[ProjectDocuments] File selected:", file.name, file.type, file.size);

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error("[ProjectDocuments] File too large:", file.size);
      alert("Le fichier est trop volumineux. Taille maximale : 10 Mo.");
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error("[ProjectDocuments] Invalid file type:", file.type);
      alert("Format non accepté. Formats acceptés : PDF, JPG, PNG.");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("[ProjectDocuments] No user authenticated");
        alert("Vous devez être connecté pour uploader un document.");
        return;
      }

      console.log("[ProjectDocuments] User authenticated:", user.id);

      const { data: pro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pro) {
        console.error("[ProjectDocuments] No professional profile found");
        alert("Profil professionnel non trouvé. Veuillez compléter votre profil.");
        return;
      }

      console.log("[ProjectDocuments] Professional ID:", pro.id);

      // Upload file to storage
      const bucket = file.type === 'application/pdf' ? 'project-docs' : 'portfolios';
      const path = `pro/${pro.id}/projects/${projectId}`;

      console.log("[ProjectDocuments] Uploading to bucket:", bucket, "path:", path);
      const fileUrl = await uploadFile(file, bucket, path);
      console.log("[ProjectDocuments] Upload successful:", fileUrl);

      // Insert record into project_documents
      const { error } = await supabase.from("project_documents").insert({
        professional_id: pro.id,
        pro_project_id: projectId,
        project_title: file.name.split('.')[0],
        contract_url: fileUrl,
        status: "pending_review"
      });

      if (error) {
        console.error("[ProjectDocuments] Database insert error:", error);
        if (error.code === '42501') {
          console.error('[ProjectDocuments] [RLS] ========================================');
          console.error('[ProjectDocuments] [RLS] ❌ RLS POLICY VIOLATION - project_documents table');
          console.error('[ProjectDocuments] [RLS] ========================================');
          console.error('[ProjectDocuments] [RLS] Professional ID:', pro.id);
          console.error('[ProjectDocuments] [RLS] User ID:', user.id);
          console.error('[ProjectDocuments] [RLS] Error:', error.message);
          console.error('[ProjectDocuments] [RLS] Fix: Check INSERT policy on project_documents table');
          console.error('[ProjectDocuments] [RLS] ========================================');
          alert("Erreur de permissions. Veuillez contacter le support.");
        } else {
          alert("Erreur lors de l'enregistrement du document.");
        }
        return;
      }

      console.log("[ProjectDocuments] ✅ Document saved successfully");
      alert("Document uploadé avec succès !");
      fetchDocuments();
    } catch (err) {
      console.error("[ProjectDocuments] Upload error:", err);
      alert("Erreur lors de l'upload du document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return;

    console.log("[ProjectDocuments] Deleting document:", docId);
    const { error } = await supabase
      .from("project_documents")
      .delete()
      .eq("id", docId);

    if (error) {
      console.error("[ProjectDocuments] Delete error:", error);
      alert("Erreur lors de la suppression du document.");
      return;
    }

    console.log("[ProjectDocuments] ✅ Document deleted successfully");
    fetchDocuments();
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/pro/projets/${projectId}`}
            className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au projet
          </Link>
          <h1 className="text-2xl font-bold text-on-surface">
            Documents — {projectTitle}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Gérez les documents et fichiers de ce projet
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="relative group border-2 border-dashed border-outline-variant/30 rounded-2xl p-8 bg-surface-container-low hover:bg-kelen-green-50/20 hover:border-kelen-green-300 transition-all cursor-pointer text-center">
        <div className="w-16 h-16 bg-surface-container rounded-full shadow-inner flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
          {isUploading ? (
            <div className="w-8 h-8 border-4 border-kelen-green-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-on-surface-variant/40 group-hover:text-kelen-green-600 transition-colors" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-on-surface mb-2">Déposez vos documents ici</h3>
        <p className="text-sm text-on-surface-variant mb-4 italic">
          Chiffrement AES-256 de bout en bout. Formats acceptés : PDF, JPG, PNG (Max 10Mo).
        </p>
        <button className="px-6 py-3 bg-kelen-green-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-kelen-green-600/20 active:scale-95 transition-all">
          SÉLECTIONNER FICHIER
        </button>
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleUpload}
          disabled={isUploading}
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-on-surface">
          Fichiers ({documents.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-kelen-green-100 text-kelen-green-700'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-kelen-green-100 text-kelen-green-700'
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
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl">
          <FileText className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="text-lg font-semibold text-on-surface mb-2">Aucun document</h3>
          <p className="text-sm text-on-surface-variant">
            Uploadez votre premier document pour ce projet
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`group cursor-pointer bg-surface-container-low rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${
                selectedDoc?.id === doc.id
                  ? 'border-kelen-green-500 shadow-lg'
                  : 'border-transparent hover:border-outline-variant/30'
              }`}
            >
              <div className="aspect-[4/3] bg-surface-container flex items-center justify-center relative">
                <FileText className="w-12 h-12 text-on-surface-variant/30" />
                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-semibold uppercase ${
                  doc.status === 'published'
                    ? 'bg-kelen-green-100 text-kelen-green-700'
                    : doc.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {doc.status === 'published' ? 'Vérifié' : doc.status === 'rejected' ? 'Refusé' : 'En examen'}
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm text-on-surface truncate mb-1">
                  {doc.project_title}
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
                  Statut
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
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`group cursor-pointer transition-colors ${
                    selectedDoc?.id === doc.id
                      ? 'bg-kelen-green-50/50'
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
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      doc.status === 'published'
                        ? 'bg-kelen-green-100 text-kelen-green-700'
                        : doc.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.status === 'published' ? 'Vérifié' : doc.status === 'rejected' ? 'Refusé' : 'En examen'}
                    </span>
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
          <div className="relative w-96 bg-surface dark:bg-surface shadow-2xl overflow-y-auto border-l border-outline-variant/20">
            <div className="sticky top-0 bg-surface border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-on-surface">Détails du document</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="bg-surface-container rounded-xl p-4">
                <div className="aspect-square bg-surface-container-low rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-16 h-16 text-on-surface-variant/30" />
                </div>
                <h4 className="font-semibold text-sm text-on-surface truncate mb-2 px-2">
                  {selectedDoc.project_title}
                </h4>
                <div className="flex justify-center px-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedDoc.status === 'published'
                      ? 'bg-kelen-green-100 text-kelen-green-700'
                      : selectedDoc.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedDoc.status === 'published' ? 'Certification active' : 'En attente'}
                  </span>
                </div>
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
                    <span className="font-medium text-kelen-green-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                      AES-256
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                <a
                  href={selectedDoc.contract_url}
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-kelen-green-600 text-white rounded-xl font-semibold text-sm hover:bg-kelen-green-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ouvrir le document
                </a>
                <button
                  onClick={() => handleDelete(selectedDoc.id)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors"
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
  );
}
