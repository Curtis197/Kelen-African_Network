"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import { Image as ImageIcon, FileText, MapPin, Calendar, X, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const projectDocumentSchema = z.object({
  project_title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  project_description: z.string().optional(),
  project_date: z.string().optional(),
  project_amount: z.string().optional(),
  contract_file: z.any().optional(),
});

type ProjectDocumentFormData = z.infer<typeof projectDocumentSchema>;

interface ProjectDocumentFormProps {
  professionalId: string;
  initialData?: any;
}

export function ProjectDocumentForm({ professionalId, initialData }: ProjectDocumentFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectDocumentFormData>({
    resolver: zodResolver(projectDocumentSchema),
    defaultValues: initialData || {
      project_title: "",
      project_description: "",
      project_date: new Date().toISOString().split('T')[0],
      project_amount: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProjectDocumentFormData) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let contractUrl = "";
      if (contractFile) {
        const path = `contracts/${user.id}/${Date.now()}_${contractFile.name}`;
        contractUrl = await uploadFile(contractFile, "contracts", path);
      }

      const photoUrls: string[] = [];
      if (imageFiles.length > 0) {
        const uploads = imageFiles.map(async (file) => {
          const path = `portfolios/${user.id}/${Date.now()}_${file.name}`;
          return uploadFile(file, "portfolios", path);
        });
        const results = await Promise.all(uploads);
        photoUrls.push(...results);
      }

      const { error: insertError } = await supabase.from("project_documents").insert({
        professional_id: professionalId,
        project_title: data.project_title,
        project_description: data.project_description || null,
        project_date: data.project_date || null,
        project_amount: data.project_amount ? parseFloat(data.project_amount) : null,
        contract_url: contractUrl || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        status: "pending_review",
      });

      if (insertError) throw insertError;

      toast.success("Projet enregistré avec succès");
      router.push("/pro/realisations");
      router.refresh();
    } catch (error) {
      console.error("Error saving project document:", error);
      toast.error("Erreur lors de l'enregistrement du projet.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
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
        <div className="space-y-8 lg:col-span-7">
          <section className="space-y-6">
            <h2 className="font-headline text-xl font-bold text-on-surface">Détails du projet</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Titre de la réalisation</label>
                <input 
                  {...register("project_title")}
                  placeholder="Ex: Construction Villa Moderne à Abidjan"
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                />
                {errors.project_title && <p className="text-xs text-kelen-red-500">{errors.project_title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Description détaillée</label>
                <textarea 
                  {...register("project_description")}
                  rows={6}
                  placeholder="Décrivez les défis relevés, les matériaux utilisés, et le résultat final..."
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none resize-none"
                />
                {errors.project_description && <p className="text-xs text-kelen-red-500">{errors.project_description.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <MapPin size={14} className="text-kelen-green-600" />
                    Date du projet
                  </label>
                  <input 
                    type="date"
                    {...register("project_date")}
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Calendar size={14} className="text-kelen-yellow-700" />
                    Montant (optionnel)
                  </label>
                  <input 
                    type="number"
                    {...register("project_amount")}
                    placeholder="Ex: 5000000"
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="lg:hidden">
             <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 py-4 font-headline text-sm font-bold text-white shadow-xl shadow-kelen-green-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Enregistrer le projet"}
            </button>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-5">
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

          <section className="space-y-4 rounded-[1.5rem] bg-surface-container-low p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <FileText size={18} className="text-kelen-yellow-700" />
                Contrat (requis)
              </h3>
              <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-on-surface shadow-sm transition-all hover:bg-stone-50">
                <input 
                  type="file" 
                  accept=".pdf"
                  className="hidden" 
                  onChange={(e) => e.target.files && setContractFile(e.target.files[0])}
                />
                {contractFile ? "Changer" : "Ajouter"}
              </label>
            </div>

            <div className="space-y-2">
              {contractFile && (
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-on-surface-variant" />
                    <span className="max-w-[150px] truncate text-xs font-medium text-on-surface">{contractFile.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setContractFile(null)}
                    className="text-kelen-red-500 hover:text-kelen-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {!contractFile && (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-on-surface-variant/10 rounded-xl">
                  <FileText size={32} className="mb-2 text-on-surface-variant/20" />
                  <p className="text-xs text-on-surface-variant/50">PDF du contrat signé</p>
                </div>
              )}
            </div>
          </section>

          <div className="hidden lg:block pt-6">
             <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 py-5 font-headline text-base font-bold text-white shadow-xl shadow-kelen-green-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={24} /> : "Soumettre pour vérification"}
            </button>
            <p className="mt-4 text-center text-[10px] text-on-surface-variant/50 italic">
              En soumettant, vous confirmez l'authenticité de ces travaux.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
