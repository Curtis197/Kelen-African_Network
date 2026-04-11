"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import Link from "next/link";

interface ProjectDocument {
  id: string;
  project_title: string;
  project_date: string;
  status: "pending_review" | "published" | "rejected";
  contract_url: string;
  created_at: string;
}

export default function ProDocumentsPage() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (pro) {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("professional_id", pro.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
      } else {
        setDocuments((data as ProjectDocument[]) || []);
      }
    }
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[Documents] No file selected");
      return;
    }

    console.log("[Documents] File selected:", file.name, file.type, file.size);

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error("[Documents] File too large:", file.size);
      alert("Le fichier est trop volumineux. Taille maximale : 10 Mo.");
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error("[Documents] Invalid file type:", file.type);
      alert("Format non accepté. Formats acceptés : PDF, JPG, PNG.");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("[Documents] No user authenticated");
        alert("Vous devez être connecté pour uploader un document.");
        return;
      }

      console.log("[Documents] User authenticated:", user.id);

      const { data: pro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pro) {
        console.error("[Documents] No professional profile found");
        alert("Profil professionnel non trouvé. Veuillez compléter votre profil.");
        return;
      }

      console.log("[Documents] Professional ID:", pro.id);

      // Upload file to storage
      const bucket = file.type === 'application/pdf' ? 'project-docs' : 'portfolios';
      const path = `pro/${pro.id}`;
      
      console.log("[Documents] Uploading to bucket:", bucket, "path:", path);
      const fileUrl = await uploadFile(file, bucket, path);
      console.log("[Documents] Upload successful:", fileUrl);

      // Insert record into project_documents
      const { error } = await supabase.from("project_documents").insert({
        professional_id: pro.id,
        project_title: file.name.split('.')[0],
        contract_url: fileUrl,
        status: "pending_review"
      });

      if (error) {
        console.error("[Documents] Database insert error:", error);
        if (error.code === '42501') {
          console.error('[RLS] ========================================');
          console.error('[RLS] ❌ RLS POLICY VIOLATION - project_documents table');
          console.error('[RLS] ========================================');
          console.error('[RLS] Professional ID:', pro.id);
          console.error('[RLS] User ID:', user.id);
          console.error('[RLS] Error:', error.message);
          console.error('[RLS] Fix: Check INSERT policy on project_documents table');
          console.error('[RLS] ========================================');
          alert("Erreur de permissions. Veuillez contacter le support.");
        } else {
          alert("Erreur lors de l'enregistrement du document.");
        }
        return;
      }

      console.log("[Documents] ✅ Document saved successfully");
      alert("Document uploadé avec succès !");
      fetchDocuments();
    } catch (err) {
      console.error("[Documents] Upload error:", err);
      alert("Erreur lors de l'upload du document.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Main Content Side */}
      <div className="flex-1 space-y-10 max-w-5xl">
        <header>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">
            <span>Documents</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface">Tous les fichiers</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold font-headline leading-tight tracking-tight text-on-surface">
            Coffre-fort <span className="text-primary-container">Numérique</span>
          </h1>
          <p className="mt-3 text-stone-500 font-medium max-w-xl">
            Stockez et gérez vos preuves d&apos;activité en toute sécurité. Vos documents sont chiffrés et vérifiés par nos experts.
          </p>
        </header>

        {/* Folders Section (Static for now as per mock) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Dossiers récents</h3>
            <button className="text-xs font-bold text-kelen-green-600 hover:underline">Voir tout</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Contrats Fonciers", count: 12, size: "48.5 MB", icon: "folder", color: "text-amber-600", bg: "bg-amber-50" },
              { name: "Plans Architecturaux", count: 8, size: "1.2 GB", icon: "architecture", color: "text-kelen-green-600", bg: "bg-kelen-green-50" },
              { name: "Preuves de Paiement", count: 24, size: "12.8 MB", icon: "account_balance_wallet", color: "text-blue-600", bg: "bg-blue-50" }
            ].map((folder, i) => (
              <div key={i} className="group cursor-pointer bg-white p-6 rounded-[2rem] border border-stone-100 transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/50 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${folder.bg} flex items-center justify-center ${folder.color}`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{folder.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-stone-900">{folder.name}</p>
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{folder.count} Fichiers</p>
                </div>
                <span className="material-symbols-outlined text-stone-200 group-hover:text-stone-400 transition-colors">more_vert</span>
              </div>
            ))}
          </div>
        </section>

        {/* Documents Grid/List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Fichiers Récents</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-kelen-green-600 border border-stone-100' : 'text-stone-400 hover:bg-stone-100'}`}
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-kelen-green-600 border border-stone-100' : 'text-stone-400 hover:bg-stone-100'}`}
              >
                <span className="material-symbols-outlined text-sm">list</span>
              </button>
            </div>
          </div>

          {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/3] bg-white rounded-[2rem] border border-stone-100 animate-pulse"></div>
                ))}
             </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  onClick={() => setSelectedDoc(doc)}
                  className={`group cursor-pointer bg-white rounded-[2rem] overflow-hidden transition-all duration-300 border-2 ${selectedDoc?.id === doc.id ? 'border-kelen-green-500 shadow-xl' : 'border-transparent hover:shadow-xl hover:shadow-stone-200/30'}`}
                >
                  <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-stone-300 group-hover:scale-110 transition-transform">
                      {doc.contract_url.endsWith('.pdf') ? 'picture_as_pdf' : 'image'}
                    </span>
                    <div className={`absolute top-4 left-4 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                       doc.status === 'published' ? 'bg-kelen-green-500 text-white' :
                       doc.status === 'rejected' ? 'bg-kelen-red-500 text-white' :
                       'bg-white/90 text-stone-600'
                    }`}>
                      {doc.contract_url.split('.').pop() || 'FILE'}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-bold text-xs truncate text-stone-900 mb-1">{doc.project_title}</p>
                    <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.1em]">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="col-span-full py-20 text-center bg-stone-50 border-2 border-dashed border-stone-100 rounded-[2rem]">
                  <span className="material-symbols-outlined text-5xl text-stone-200 mb-4 italic">cloud_off</span>
                  <p className="text-sm font-medium text-stone-400 italic">Aucun document dans le coffre-fort.</p>
                </div>
              )}
            </div>
          ) : (
             <div className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-stone-50/50 border-b border-stone-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nom & Date</th>
                        <th className="px-6 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Statut</th>
                        <th className="px-8 py-5 text-right"></th>
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
                                  <span className="material-symbols-outlined">attachment</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-stone-900">{doc.project_title}</p>
                                  <p className="text-[10px] text-stone-400 uppercase font-black">{new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                doc.status === 'published' ? 'bg-kelen-green-100 text-kelen-green-700' :
                                doc.status === 'rejected' ? 'bg-kelen-red-100 text-kelen-red-700' :
                                'bg-stone-100 text-stone-600'
                              }`}>
                                {doc.status === 'published' ? 'Vérifié' : doc.status === 'rejected' ? 'Refusé' : 'En examen'}
                              </span>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <button className="material-symbols-outlined text-stone-300 group-hover:text-kelen-green-600 transition-colors">download</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
        </section>

        {/* Secure Upload Zone */}
        <section>
          <div className="relative group border-2 border-dashed border-stone-200 rounded-[3rem] p-12 bg-white hover:bg-kelen-green-50/20 hover:border-kelen-green-300 transition-all text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full shadow-inner flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
              {isUploading ? (
                <div className="w-8 h-8 border-4 border-kelen-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-stone-300 group-hover:text-kelen-green-600 transition-colors">cloud_upload</span>
              )}
            </div>
            <h3 className="text-xl font-headline font-bold text-stone-900 mb-2">Déposez vos documents ici</h3>
            <p className="text-sm text-stone-500 font-medium mb-8 max-w-sm mx-auto italic">Chiffrement AES-256 de bout en bout. Formats acceptés : PDF, JPG, PNG (Max 10Mo).</p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {/* PDF Document Upload */}
              <label className="relative inline-flex cursor-pointer">
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-kelen-green-600 to-kelen-green-400 text-white rounded-2xl font-black font-headline text-sm shadow-xl shadow-kelen-green-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                >
                  📄 UPLOADER PDF
                </button>
                <input
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>

              {/* Photo Upload */}
              <label className="relative inline-flex cursor-pointer">
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl font-black font-headline text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                >
                  📷 UPLOADER PHOTO
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Right Preview Side (Sidebar Style) */}
      <aside className={`fixed lg:relative inset-y-0 right-0 w-80 lg:w-[22rem] bg-white border-l border-stone-100 p-8 shadow-2xl lg:shadow-none transition-transform duration-500 z-50 transform ${selectedDoc ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 opacity-0 lg:opacity-20 pointer-events-none'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-black font-headline text-stone-900 italic">Détails Fichier</h2>
          <button 
            onClick={() => setSelectedDoc(null)}
            className="p-1 hover:bg-stone-100 rounded-xl transition-colors lg:hidden"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {selectedDoc ? (
          <div className="space-y-8">
            <div className="bg-stone-50 p-4 rounded-3xl border border-stone-100">
              <div className="aspect-square bg-white rounded-2xl shadow-sm overflow-hidden flex items-center justify-center relative group">
                <span className="material-symbols-outlined text-6xl text-stone-100 italic">inventory_2</span>
                <div className="absolute inset-0 bg-kelen-green-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="px-4 py-2 bg-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Aperçu</button>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h4 className="font-bold text-stone-900 leading-tight mb-2 truncate px-2">{selectedDoc.project_title}</h4>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  selectedDoc.status === 'published' ? 'bg-kelen-green-100 text-kelen-green-700' :
                  selectedDoc.status === 'rejected' ? 'bg-kelen-red-100 text-kelen-red-700' :
                  'bg-stone-100 text-stone-600'
                }`}>
                  {selectedDoc.status === 'published' ? 'Certification active' : 'En attente'}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Métadonnées</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Poids</span>
                  <span className="font-bold text-stone-900">1.2 MB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Créé le</span>
                  <span className="font-bold text-stone-900">{new Date(selectedDoc.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Type</span>
                  <span className="font-bold text-stone-900 uppercase">{selectedDoc.contract_url.split('.').pop()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Sécurité</span>
                  <span className="text-kelen-green-600 font-bold flex items-center gap-1 group">
                    <span className="material-symbols-outlined text-xs">verified_user</span>
                    BitLocker SSL
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Tags Associés</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-stone-50 text-[10px] font-bold text-stone-600 rounded-lg">#Propriété</span>
                <span className="px-3 py-1 bg-stone-50 text-[10px] font-bold text-stone-600 rounded-lg">#Audit2024</span>
                <button className="text-kelen-green-600 hover:scale-110 transition-transform"><span className="material-symbols-outlined text-xs">add_circle</span></button>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-3">
              <button className="py-3 bg-stone-100 text-stone-900 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-stone-200 transition-all">
                Partager
              </button>
              <a 
                href={selectedDoc.contract_url}
                target="_blank"
                className="py-3 bg-kelen-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-kelen-green-700 transition-all shadow-md shadow-kelen-green-600/10"
              >
                Ouvrir
              </a>
            </div>
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-40 italic">
            <span className="material-symbols-outlined text-5xl mb-4 italic">draft</span>
            <p className="text-sm font-medium">Sélectionnez un fichier pour voir les détails de certification.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
