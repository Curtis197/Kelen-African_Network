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
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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
    if (!file) return;

    setIsUploading(true);
    // Simulate upload for now (Storage integration pending)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (pro) {
      try {
        const fileUrl = await uploadFile(file, "project-docs", `pro/${pro.id}`);
        
        const { error } = await supabase.from("project_documents").insert({
          professional_id: pro.id,
          project_title: file.name.split('.')[0],
          contract_url: fileUrl,
          status: "pending_review"
        });

        if (!error) {
          fetchDocuments();
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    setIsUploading(false);
  };

  return (
    <main className="max-w-6xl">
       <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Coffre-fort numérique</h1>
        <p className="mt-2 text-stone-500 font-medium">
          Centralisez vos preuves d&apos;activité et documents légaux pour renforcer votre certification Kelen.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-kelen-green-600">cloud_upload</span>
              Ajouter un document
            </h3>
            
            <div className="relative group border-2 border-dashed border-stone-200 rounded-2xl p-8 bg-stone-50/50 hover:bg-kelen-green-50/50 hover:border-kelen-green-300 transition-all cursor-pointer text-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-kelen-green-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-stone-400 group-hover:text-kelen-green-600">upload_file</span>
                )}
              </div>
              <p className="text-sm font-bold text-stone-900 mb-1">Cliquer ou glisser</p>
              <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">PDF, JPG (Max 10Mo)</p>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleUpload}
                disabled={isUploading}
              />
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <span className="material-symbols-outlined text-amber-600 text-sm">warning</span>
              <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                Les documents sont vérifiés par nos modérateurs sous 48h. Un document falsifié peut entraîner la suspension du compte.
              </p>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-stone-900">Documents archivés</h3>
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{documents.length} FICHIERS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nom du fichier</th>
                    <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Statut</th>
                    <th className="px-8 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    [1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-8 py-5"><div className="h-4 w-32 bg-stone-100 rounded" /></td>
                        <td className="px-6 py-5"><div className="h-4 w-20 bg-stone-100 rounded" /></td>
                        <td className="px-8 py-5"><div className="h-4 w-12 bg-stone-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">{doc.project_title}</p>
                            <p className="text-[10px] text-stone-400 uppercase font-black">{new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          doc.status === 'published' ? 'bg-kelen-green-100 text-kelen-green-700' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {doc.status === 'published' ? 'Vérifié' : 
                           doc.status === 'rejected' ? 'Refusé' : 'En examen'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 transition-colors">
                          <span className="material-symbols-outlined">download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && documents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-stone-200 mb-4">folder_open</span>
                        <p className="text-sm text-stone-400 italic">Aucun document soumis pour le moment.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
