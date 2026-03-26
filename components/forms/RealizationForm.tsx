"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { realizationSchema, type RealizationFormData } from "@/lib/utils/validators";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import { Image as ImageIcon, FileText, MapPin, Calendar, Plus, X, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RealizationFormProps {
  professionalId: string;
  initialData?: any; // For edit mode later
}

export function RealizationForm({ professionalId, initialData }: RealizationFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RealizationFormData>({
    resolver: zodResolver(realizationSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      location: "",
      completion_date: new Date().toISOString().split('T')[0],
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeDoc = (index: number) => {
    setDocFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RealizationFormData) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // 1. Create realization record
      const { data: realization, error: relError } = await supabase
        .from("professional_realizations")
        .insert({
          professional_id: professionalId,
          title: data.title,
          description: data.description,
          location: data.location,
          completion_date: data.completion_date,
        })
        .select()
        .single();

      if (relError) throw relError;

      // 2. Upload Images
      if (imageFiles.length > 0) {
        const imageUploads = imageFiles.map(async (file, index) => {
          const path = `realizations/${user.id}/${realization.id}`;
          const url = await uploadFile(file, "portfolios", path);
          return {
            realization_id: realization.id,
            url,
            is_main: index === 0, // First image is main by default
          };
        });
        
        const imageData = await Promise.all(imageUploads);
        const { error: imgError } = await supabase.from("realization_images").insert(imageData);
        if (imgError) console.error("Error inserting images:", imgError);
      }

      // 3. Upload Documents
      if (docFiles.length > 0) {
        const docUploads = docFiles.map(async (file) => {
          const path = `realizations/${user.id}/${realization.id}`;
          const url = await uploadFile(file, "project-docs", path);
          return {
            realization_id: realization.id,
            url,
            title: file.name,
            type: file.type,
          };
        });

        const docData = await Promise.all(docUploads);
        const { error: docTableError } = await supabase.from("realization_documents").insert(docData);
        if (docTableError) console.error("Error inserting documents:", docTableError);
      }

      router.push("/pro/realisations");
      router.refresh();
    } catch (error) {
      console.error("Error saving realization:", error);
      alert("Erreur lors de l'enregistrement du projet.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
      {/* Editorial Header */}
      <div className="flex items-center justify-between border-b border-transparent pb-6">
        <Link 
          href="/pro/realisations" 
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux réalisations
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Metadata */}
        <div className="space-y-8 lg:col-span-7">
          <section className="space-y-6">
            <h2 className="font-headline text-xl font-bold text-on-surface">Détails du projet</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Titre de la réalisation</label>
                <input 
                  {...register("title")}
                  placeholder="Ex: Construction Villa Moderne à Abidjan"
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                />
                {errors.title && <p className="text-xs text-kelen-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Description détaillée</label>
                <textarea 
                  {...register("description")}
                  rows={6}
                  placeholder="Décrivez les défis relevés, les matériaux utilisés, et le résultat final..."
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none resize-none"
                />
                {errors.description && <p className="text-xs text-kelen-red-500">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <MapPin size={14} className="text-kelen-green-600" />
                    Localisation
                  </label>
                  <input 
                    {...register("location")}
                    placeholder="Ville, Pays"
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                  {errors.location && <p className="text-xs text-kelen-red-500">{errors.location.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Calendar size={14} className="text-kelen-yellow-700" />
                    Date de réalisation
                  </label>
                  <input 
                    type="date"
                    {...register("completion_date")}
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                  {errors.completion_date && <p className="text-xs text-kelen-red-500">{errors.completion_date.message}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Submission Button Mobile */}
          <div className="lg:hidden">
             <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 py-4 font-headline text-sm font-bold text-white shadow-xl shadow-kelen-green-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Enregistrer la réalisation"}
            </button>
          </div>
        </div>

        {/* Right Column: Assets */}
        <div className="space-y-8 lg:col-span-5">
          {/* Images Section */}
          <section className="space-y-4 rounded-[1.5rem] bg-surface-container-low p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <ImageIcon size={18} className="text-kelen-green-600" />
                Galerie Photos
              </h3>
              <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-on-surface shadow-sm transition-all hover:bg-stone-50">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                Ajouter
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {imageFiles.map((file, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-stone-200">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                  />
                  <button 
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kelen-red-500 text-white shadow-sm"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {imageFiles.length === 0 && (
                <div className="col-span-3 flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-on-surface-variant/10 rounded-xl">
                  <ImageIcon size={32} className="mb-2 text-on-surface-variant/20" />
                  <p className="text-xs text-on-surface-variant/50">Aucune photo ajoutée</p>
                </div>
              )}
            </div>
          </section>

          {/* Documents Section */}
          <section className="space-y-4 rounded-[1.5rem] bg-surface-container-low p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <FileText size={18} className="text-kelen-yellow-700" />
                Coffre Technique
              </h3>
              <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-on-surface shadow-sm transition-all hover:bg-stone-50">
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleDocChange}
                />
                Ajouter
              </label>
            </div>

            <div className="space-y-2">
              {docFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-on-surface-variant" />
                    <span className="max-w-[150px] truncate text-xs font-medium text-on-surface">{file.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeDoc(i)}
                    className="text-kelen-red-500 hover:text-kelen-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {docFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-on-surface-variant/10 rounded-xl">
                  <FileText size={32} className="mb-2 text-on-surface-variant/20" />
                  <p className="text-xs text-on-surface-variant/50">Plans, factures, PV...</p>
                </div>
              )}
            </div>
          </section>

          {/* Submission Button Desktop */}
          <div className="hidden lg:block pt-6">
             <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 py-5 font-headline text-base font-bold text-white shadow-xl shadow-kelen-green-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={24} /> : "Publier cette réalisation"}
            </button>
            <p className="mt-4 text-center text-[10px] text-on-surface-variant/50 italic">
              En publiant, vous confirmez l'authenticité de ces travaux.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
