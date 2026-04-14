"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import Link from "next/link";

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

  const fetchDocuments = async () => {
    console.group('[ProDocuments] fetchDocuments');
    console.log('▶ Start');
    setIsLoading(true);

    // ── Auth ──────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('[AUTH] ❌ getUser failed:', authError.message);
      setIsLoading(false);
      console.groupEnd();
      return;
    }
    if (!user) {
      console.error('[AUTH] ❌ No authenticated user');
      setIsLoading(false);
      console.groupEnd();
      return;
    }
    console.log('[AUTH] ✅ user.id:', user.id);

    // ── Professional lookup ───────────────────────────────────────
    const { data: pro, error: proError } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (proError) {
      console.error('[DB] ❌ professionals lookup failed');
      console.error('  code:', proError.code, '| message:', proError.message);
      if (proError.code === 'PGRST116') {
        console.error('  → No professional row found for this user_id — profile missing?');
      }
      if (proError.code === '42501') {
        console.error('  → [RLS] SELECT blocked on professionals table');
      }
      setIsLoading(false);
      console.groupEnd();
      return;
    }
    console.log('[DB] ✅ professional.id:', pro.id);

    // ── Fetch documents ───────────────────────────────────────────
    console.log('[FETCH] Querying project_documents WHERE professional_id =', pro.id);
    const { data, error } = await supabase
      .from("project_documents")
      .select("*")
      .eq("professional_id", pro.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('[FETCH] ❌ project_documents query failed');
      console.error('  code:', error.code, '| message:', error.message);
      if (error.code === '42501') {
        console.error('  → [RLS] SELECT blocked on project_documents — check "pdocs_pro_own" policy');
      }
      setIsLoading(false);
      console.groupEnd();
      return;
    }

    console.log('[FETCH] ✅ rows returned:', data?.length ?? 0);
    if (!data || data.length === 0) {
      console.warn('[FETCH] ⚠️ 0 rows — either empty table OR silent RLS filtering');
      console.warn('  Tip: run in Supabase SQL editor as service_role:');
      console.warn(`  SELECT * FROM project_documents WHERE professional_id = '${pro.id}';`);
    } else {
      data.forEach((doc, i) => {
        console.log(`[FETCH] doc[${i}]`, {
          id: doc.id,
          project_title: doc.project_title,
          contract_url: doc.contract_url,
          url_length: doc.contract_url?.length,
          url_trimmed: doc.contract_url?.trim(),
          isPdf: /\.pdf(\?.*)?$/i.test(doc.contract_url?.trim() || ''),
          created_at: doc.created_at,
        });
      });
    }

    setDocuments((data as ProjectDocument[]) || []);
    setIsLoading(false);
    console.groupEnd();
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

      // Upload file to storage - use portfolios bucket for all files (works reliably)
      const bucket = 'portfolios';
      const path = `${user.id}`;

      console.log("[Documents] Uploading to bucket:", bucket, "path:", path);
      const fileUrl = await uploadFile(file, bucket, path);
      console.log("[Documents] Upload successful:", fileUrl);

      // Insert record into project_documents
      const { error } = await supabase.from("project_documents").insert({
        professional_id: pro.id,
        project_title: file.name.split('.')[0],
        contract_url: fileUrl
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
              {documents.map((doc) => {
                const cleanUrl = doc.contract_url?.trim() || "";
                const isPdf = /\.pdf(\?.*)?$/i.test(cleanUrl);
                const hasImgError = imgErrors.has(doc.id);
                console.log('[RENDER] grid card', doc.id, {
                  cleanUrl,
                  isPdf,
                  hasImgError,
                  willRender: isPdf ? 'pdf-icon' : hasImgError ? 'fallback-icon' : 'img-tag',
                });
                return (
                 <div 
                  key={doc.id} 
                  onClick={() => setSelectedDoc(doc)}
                  className={`group cursor-pointer bg-white rounded-[2rem] overflow-hidden transition-all duration-300 border-2 ${selectedDoc?.id === doc.id ? 'border-kelen-green-500 shadow-xl' : 'border-transparent hover:shadow-xl hover:shadow-stone-200/30'}`}
                 >
                  <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden flex items-center justify-center group-hover:bg-stone-200 transition-colors p-2">
                    {/\.pdf(\?.*)?$/i.test(cleanUrl) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-stone-100 group-hover:bg-stone-50 transition-colors">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">picture_as_pdf</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Document</span>
                      </div>
                    ) : imgErrors.has(doc.id) ? (
                      <span className="material-symbols-outlined text-4xl text-stone-300 group-hover:scale-110 transition-transform">
                        description
                      </span>
                    ) : (
                      <img
                        src={cleanUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 shadow-sm"
                        onLoad={() => console.log('[IMG] ✅ loaded:', cleanUrl)}
                        onError={() => {
                          console.error('[IMG] ❌ failed to load:', cleanUrl);
                          setImgErrors(prev => new Set([...prev, doc.id]));
                        }}
                      />
                    )}
                    <div className="absolute top-4 left-4 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-white/90 text-stone-600 shadow-sm backdrop-blur-md">
                      {cleanUrl.split('?')[0].split('.').pop()?.substring(0, 4) || 'FILE'}
                    </div>
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

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${selectedDoc ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setSelectedDoc(null)} 
      />

      {/* Right Preview Side (Overlay Style) */}
      <aside className={`fixed inset-y-0 right-0 w-80 lg:w-[26rem] bg-white border-l border-stone-100 p-8 shadow-2xl transition-transform duration-500 z-50 transform ${selectedDoc ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-black font-headline text-stone-900 italic">Détails Fichier</h2>
          <button 
            onClick={() => setSelectedDoc(null)}
            className="p-1 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {selectedDoc && (() => {
          const cleanUrl = selectedDoc.contract_url?.trim() || "";
          return (
          <div className="space-y-8 h-full overflow-y-auto pb-20 scrollbar-hide">
            <div className="bg-stone-50 p-4 rounded-3xl border border-stone-100">
              <div className="aspect-square bg-stone-100 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center relative group">
                {/\.pdf(\?.*)?$/i.test(cleanUrl) ? (
                  <iframe src={`${cleanUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 pointer-events-none" title="PDF Preview" />
                ) : imgErrors.has(selectedDoc.id) ? (
                  <span className="material-symbols-outlined text-6xl text-stone-200 italic">inventory_2</span>
                ) : (
                  <img
                    src={cleanUrl}
                    alt={selectedDoc.project_title}
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('[IMG] ✅ sidebar loaded:', cleanUrl)}
                    onError={() => {
                      console.error('[IMG] ❌ sidebar failed to load:', cleanUrl);
                      setImgErrors(prev => new Set([...prev, selectedDoc.id]));
                    }}
                  />
                )}
                
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <a href={cleanUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform text-stone-900">Aperçu Complet</a>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h4 className="font-bold text-stone-900 leading-tight mb-2 truncate px-2">{selectedDoc.project_title}</h4>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Métadonnées</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Créé le</span>
                  <span className="font-bold text-stone-900">{new Date(selectedDoc.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Type</span>
                  <span className="font-bold text-stone-900 uppercase">
                    {cleanUrl.split('?')[0].split('.').pop()?.substring(0, 4) || 'INCONNU'}
                  </span>
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
          );
        })()}
      </aside>
    </div>
  );
}
