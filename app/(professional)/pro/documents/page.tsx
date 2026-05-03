"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import { Trash2, PlusCircle, ShieldCheck, X, FileText, FileJson, List, LayoutGrid, ChevronRight, Download, CloudOff, FileSearch, Loader2, Paperclip } from "lucide-react";
import NextImage from "next/image";

interface ProjectDocument {
  id: string;
  project_title: string;
  project_date: string;
  contract_url: string;
  created_at: string;
}

export default function ProDocumentsPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return;

    const { error } = await supabase.from("project_documents").delete().eq("id", docId);

    if (error) {
      alert("Erreur lors de la suppression.");
      return;
    }

    if (selectedDoc?.id === docId) setSelectedDoc(null);
    fetchDocuments();
  };

  const fetchDocuments = async () => {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("project_documents")
      .select("*")
      .eq("professional_id", pro.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setDocuments((data as ProjectDocument[]) || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 10 Mo).");
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Format non accepté. Formats acceptés : PDF, JPG, PNG, WEBP.");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: pro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pro) throw new Error("Profil pro introuvable");

      const fileUrl = await uploadFile(file, 'portfolios', user.id);
      
      const { error } = await supabase.from("project_documents").insert({
        professional_id: pro.id,
        project_title: file.name.split('.')[0],
        contract_url: fileUrl
      });

      if (error) throw error;
      
      fetchDocuments();
      alert("Document ajouté.");
    } catch (err: any) {
      alert("Erreur upload: " + ((err as any).message || 'Erreur inconnue'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Main Content */}
      <div className="flex-1 space-y-10 max-w-5xl">
        <header>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">
            <span>Documents</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-on-surface">Tous les fichiers</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-on-surface">
              Coffre-fort <span className="text-kelen-green-600">Numérique</span>
            </h1>
            {!isLoading && (
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-kelen-green-50 text-kelen-green-700 border border-kelen-green-100">
                {documents.length} fichier{documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="mt-3 text-stone-500 font-medium max-w-xl">
            Stockez et gérez vos preuves d&apos;activité en toute sécurité.
          </p>
          
          <div className="mt-8">
            <label className={`inline-flex items-center gap-2 px-6 py-3 bg-kelen-green-600 text-white rounded-2xl font-bold text-sm cursor-pointer hover:bg-kelen-green-700 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <PlusCircle className="w-4 h-4" />
              {isUploading ? "Upload en cours..." : "Ajouter un document"}
              <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept=".pdf,image/*" />
            </label>
          </div>
        </header>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Fichiers Récents</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-kelen-green-600 border border-stone-100' : 'text-stone-400 hover:bg-stone-100'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-kelen-green-600 border border-stone-100' : 'text-stone-400 hover:bg-stone-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[4/3] bg-white rounded-[2rem] border border-stone-100 animate-pulse" />
              ))}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {documents.map((doc) => {
                const cleanUrl = doc.contract_url?.trim() || "";
                const isPdf = /\.pdf(\?.*)?$/i.test(cleanUrl);
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className={`group cursor-pointer bg-white rounded-[2rem] overflow-hidden transition-all duration-300 border-2 ${selectedDoc?.id === doc.id ? 'border-kelen-green-500 shadow-xl' : 'border-transparent hover:shadow-xl hover:shadow-stone-200/30'}`}
                  >
                    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden group-hover:bg-stone-200 transition-colors">
                      {isPdf ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white border border-stone-100 group-hover:bg-50 transition-colors">
                          <FileJson className="w-10 h-10 text-red-500 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">PDF Document</span>
                        </div>
                      ) : imgErrors.has(doc.id) ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
                          <FileText className="w-10 h-10 text-stone-300" />
                        </div>
                      ) : (
                        <div className="absolute inset-0">
                          <NextImage
                            src={cleanUrl}
                            alt={doc.project_title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImgErrors(prev => new Set(prev).add(doc.id))}
                          />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-white/90 text-stone-600 shadow-sm backdrop-blur-md">
                        {cleanUrl.split('?')[0].split('.').pop()?.toUpperCase() || 'FILE'}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/90 text-red-400 hover:text-red-600 shadow-sm backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-5">
                      <p className="font-bold text-xs truncate text-stone-900 mb-1">{doc.project_title}</p>
                      <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.1em]">{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
              {documents.length === 0 && (
                <div className="col-span-full py-20 text-center bg-stone-50 border-2 border-dashed border-stone-100 rounded-[2rem]">
                  <CloudOff className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-stone-400">Aucun document dans le coffre-fort.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-stone-50/50 border-b border-stone-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nom & Date</th>
                    <th className="px-8 py-5 text-right font-black text-[10px] text-stone-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {documents.map((doc) => (
                    <tr 
                      key={doc.id} 
                      onClick={() => setSelectedDoc(doc)}
                      className={`group cursor-pointer transition-all hover:bg-stone-50/50 ${selectedDoc?.id === doc.id ? 'bg-kelen-green-50/50' : ''}`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center">
                            <Paperclip className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">{doc.project_title}</p>
                            <p className="text-[10px] text-stone-400 uppercase font-black">{new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-stone-300 group-hover:text-kelen-green-600 transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Detail Sidebar */}
      <aside className="w-full lg:w-80 shrink-0 sticky top-24">
        {selectedDoc ? (
          <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-xl shadow-stone-200/20 space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-extrabold text-lg">Détails du fichier</h3>
               <button onClick={() => setSelectedDoc(null)} className="text-stone-300 hover:text-stone-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="aspect-[4/3] bg-stone-50 rounded-2xl overflow-hidden relative border border-stone-100">
              {/\.pdf(\?.*)?$/i.test(selectedDoc.contract_url) ? (
                 <div className="absolute inset-0 flex items-center justify-center"><FileJson className="w-12 h-12 text-red-500" /></div>
              ) : (
                <NextImage src={selectedDoc.contract_url} alt="Preview" fill className="object-contain" />
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Nom</span>
                <span className="font-bold text-stone-900 truncate ml-4">{selectedDoc.project_title}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Date</span>
                <span className="font-bold text-stone-900">{new Date(selectedDoc.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Sécurité</span>
                <span className="text-kelen-green-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Chiffré AES
                </span>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-3">
              <a
                href={selectedDoc.contract_url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 bg-kelen-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-kelen-green-700 transition-all"
              >
                Ouvrir
              </a>
              <button
                onClick={() => handleDelete(selectedDoc.id)}
                className="py-3 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50/50 rounded-[2rem] p-10 border border-dashed border-stone-200 text-center">
            <FileSearch className="w-10 h-10 text-stone-200 mx-auto mb-4" />
            <p className="text-sm text-stone-400 font-medium italic">Sélectionnez un fichier pour voir les détails.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
