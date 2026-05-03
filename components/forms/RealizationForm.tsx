"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import { Image as ImageIcon, X, Loader2, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

const projectDocumentSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  completion_date: z.string().optional(),
  price: z.string().optional(),
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
  const [existingImages, setExistingImages] = useState<Array<{id: string, url: string, is_main: boolean}>>(
    initialData?.images?.map((img: any) => ({ id: img.id, url: img.url, is_main: img.is_main || false })) || []
  );
  const supabase = createClient();

  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectDocumentFormData>({
    resolver: zodResolver(projectDocumentSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      completion_date: new Date().toISOString().split('T')[0],
      price: "",
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

  const removeExistingImage = async (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    if (isEditing) {
      const { error } = await supabase
        .from("realization_images")
        .delete()
        .eq("id", imageId);
      if (error) {
        toast.error("Erreur lors de la suppression de l'image");
      } else {
      }
    }
  };

  const setFeaturedImage = (url: string) => {
    setExistingImages(prev => prev.map(img => ({
      ...img,
      is_main: img.url === url
    })));
  };

  const onSubmit = async (data: ProjectDocumentFormData) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Upload new images if any
      const newImageUrls: {url: string, file: File}[] = [];
      if (imageFiles.length > 0) {
        const uploads = imageFiles.map(async (file) => {
          const path = `portfolios/${user.id}`;
          const url = await uploadFile(file, "portfolios", path);
          return { url, file };
        });
        const results = await Promise.all(uploads);
        newImageUrls.push(...results.filter(r => r.url));
      }

      // Build update payload (no images)
      const payload: any = {
        title: data.title,
        description: data.description || null,
        completion_date: data.completion_date || null,
        price: data.price ? parseFloat(data.price) : null,
      };

      let error;

      if (isEditing) {
        // Update existing realization
        const { error: updateError } = await supabase
          .from("professional_realizations")
          .update(payload)
          .eq("id", initialData.id)
          .eq("professional_id", professionalId);
        error = updateError;

        // Update existing images (set is_main flags)
        if (!error && existingImages.length > 0) {
          // Reset all is_main flags
          await supabase
            .from("realization_images")
            .update({ is_main: false })
            .eq("realization_id", initialData.id);

          // Set is_main for featured image
          const featuredImg = existingImages.find(img => img.is_main);
          if (featuredImg) {
            await supabase
              .from("realization_images")
              .update({ is_main: true })
              .eq("id", featuredImg.id);
          }
        }

        // Insert new images
        if (!error && newImageUrls.length > 0) {
          const hasMain = existingImages.some(img => img.is_main);
          const imageRows = newImageUrls.map(({ url }, idx) => ({
            realization_id: initialData.id,
            professional_id: professionalId,
            url: url,
            is_main: !hasMain && idx === 0, // First new image is main if no existing main
          }));

          const { error: imgError } = await supabase
            .from("realization_images")
            .insert(imageRows);

          if (imgError) {
          }
        }
      } else {
        // Create new realization
        payload.professional_id = professionalId;
        const { data: newDoc, error: insertError } = await supabase
          .from("professional_realizations")
          .insert(payload)
          .select()
          .single();
        error = insertError;

        // Insert images into realization_images table
        if (!error && newImageUrls.length > 0 && newDoc) {
          const imageRows = newImageUrls.map(({ url }, idx) => ({
            realization_id: newDoc.id,
            professional_id: professionalId,
            url: url,
            is_main: idx === 0, // First image is main
          }));

          const { error: imgError } = await supabase
            .from("realization_images")
            .insert(imageRows);

          if (imgError) {
          }
        }
      }

      if (error) throw error;

      toast.success(isEditing ? "Projet mis Ã  jour avec succès" : "Projet enregistré avec succès");
      router.push("/pro/realisations");
      router.refresh();
    } catch (error) {
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
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isEditing ? "Modifier le projet" : "Détails du projet"}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Titre de la réalisation</label>
                <input
                  {...register("title")}
                  placeholder="Ex: Construction Villa Moderne Ã  Abidjan"
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
                  <label className="text-sm font-bold text-on-surface">Date du projet</label>
                  <input
                    type="date"
                    {...register("completion_date")}
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Montant (optionnel)</label>
                  <input
                    type="number"
                    {...register("price")}
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
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? "Confirmer les modifications" : "Confirmer")}
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

            {/* Show existing images when editing */}
            {isEditing && existingImages.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-on-surface-variant">Photos existantes :</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((img, i) => (
                    <div key={`existing-${img.id}`} className="relative aspect-square overflow-hidden rounded-xl bg-stone-200 group">
                      <Image
                        src={img.url}
                        alt={`Photo ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 20vw"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(img.url)}
                        className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all ${
                          img.is_main
                            ? 'bg-kelen-green-500 text-white'
                            : 'bg-white/90 text-stone-600 opacity-0 group-hover:opacity-100'
                        }`}
                        title={img.is_main ? 'Photo principale' : 'Définir comme photo principale'}
                      >
                        <Star size={12} fill={img.is_main ? 'currentColor' : 'none'} />
                      </button>
                      {img.is_main && (
                        <div className="absolute bottom-1 left-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white text-center">
                          Principale
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kelen-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New image previews */}
            {imageFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-on-surface-variant">Nouvelles photos :</p>
                <div className="grid grid-cols-3 gap-3">
                  {imageFiles.map((file, i) => {
                    const previewUrl = URL.createObjectURL(file);
                    const isFirstNew = i === 0 && existingImages.length === 0;
                    return (
                      <div key={`new-${i}`} className="relative aspect-square overflow-hidden rounded-xl bg-stone-200 group">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          sizes="(max-width: 768px) 33vw, 20vw"
                          className="object-cover"
                        />
                        {isFirstNew && (
                          <div className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kelen-green-500 text-white">
                            <Star size={12} fill="currentColor" />
                          </div>
                        )}
                        {isFirstNew && (
                          <div className="absolute bottom-1 left-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white text-center">
                            Principale
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kelen-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {imageFiles.length === 0 && (!isEditing || !initialData?.photo_urls || initialData.photo_urls.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-on-surface-variant/10 rounded-xl">
                <ImageIcon size={32} className="mb-2 text-on-surface-variant/20" />
                <p className="text-xs text-on-surface-variant/50">Aucune photo ajoutée</p>
              </div>
            )}
          </section>

          <div className="hidden lg:block pt-6">
             <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 py-5 font-headline text-base font-bold text-white shadow-xl shadow-kelen-green-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={24} /> : (isEditing ? "Confirmer les modifications" : "Confirmer")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
