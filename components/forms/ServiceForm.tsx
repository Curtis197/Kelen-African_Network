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
import { createService, updateService } from "@/lib/actions/services";

const serviceSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().default("XOF"),
  duration: z.string().optional(),
  category: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  professionalId: string;
  initialData?: any;
}

export function ServiceForm({ professionalId, initialData }: ServiceFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string; is_main: boolean }>>(
    initialData?.service_images?.map((img: any) => ({
      id: img.id,
      url: img.url,
      is_main: img.is_main || false,
    })) || []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const supabase = createClient();

  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      price: initialData?.price?.toString() || "",
      currency: initialData?.currency || "XOF",
      duration: initialData?.duration || "",
      category: initialData?.category || "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
  };

  const setFeaturedImage = (url: string) => {
    setExistingImages((prev) =>
      prev.map((img) => ({ ...img, is_main: img.url === url }))
    );
  };

  const onSubmit = async (data: ServiceFormData) => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Upload new images
      const newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const uploads = imageFiles.map(async (file) => {
          const path = `services/${user.id}`;
          return await uploadFile(file, "realization-images", path);
        });
        const results = await Promise.all(uploads);
        newImageUrls.push(...results.filter((url): url is string => !!url));
      }

      if (isEditing) {
        await updateService(initialData.id, {
          title: data.title,
          description: data.description || null,
          price: data.price ? parseFloat(data.price) : null,
          currency: data.currency,
          duration: data.duration || null,
          category: data.category || null,
          image_urls: newImageUrls,
          removed_image_ids: removedImageIds,
        });
        toast.success("Service mis à jour avec succès");
      } else {
        await createService({
          professional_id: professionalId,
          title: data.title,
          description: data.description || null,
          price: data.price ? parseFloat(data.price) : null,
          currency: data.currency,
          duration: data.duration || null,
          category: data.category || null,
          image_urls: newImageUrls,
        });
        toast.success("Service créé avec succès");
      }

      router.push("/pro/realisations?tab=services");
      router.refresh();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Erreur lors de l'enregistrement du service.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
      <div className="flex items-center justify-between border-b border-transparent pb-6">
        <Link
          href="/pro/realisations?tab=services"
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux services
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <section className="space-y-6">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isEditing ? "Modifier le service" : "Détails du service"}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Titre du service</label>
                <input
                  {...register("title")}
                  placeholder="Ex: Conception de plans architecturaux"
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                />
                {errors.title && (
                  <p className="text-xs text-kelen-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Description</label>
                <textarea
                  {...register("description")}
                  rows={6}
                  placeholder="Décrivez votre service, ce qui est inclus, et les bénéfices pour le client..."
                  className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Prix (optionnel)</label>
                  <input
                    type="number"
                    {...register("price")}
                    placeholder="Ex: 150000"
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Devise</label>
                  <select
                    {...register("currency")}
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  >
                    <option value="XOF">XOF (Franc CFA UEMOA)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar américain)</option>
                    <option value="GNF">GNF (Franc guinéen)</option>
                    <option value="XAF">XAF (Franc CFA CEMAC)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Durée (optionnel)</label>
                  <input
                    {...register("duration")}
                    placeholder="ex: 2 heures, 1 semaine"
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Catégorie (optionnel)</label>
                  <input
                    {...register("category")}
                    placeholder="Ex: Architecture, Design, Conseil..."
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
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isEditing ? (
                "Confirmer les modifications"
              ) : (
                "Confirmer"
              )}
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

            {/* Existing images when editing */}
            {isEditing && existingImages.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-on-surface-variant">Photos existantes :</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((img, i) => (
                    <div
                      key={`existing-${img.id}`}
                      className="relative aspect-square overflow-hidden rounded-xl bg-stone-200 group"
                    >
                      <img
                        src={img.url}
                        alt={`Photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(img.url)}
                        className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all ${
                          img.is_main
                            ? "bg-kelen-green-500 text-white"
                            : "bg-white/90 text-stone-600 opacity-0 group-hover:opacity-100"
                        }`}
                        title={img.is_main ? "Photo principale" : "Définir comme photo principale"}
                      >
                        <Star size={12} fill={img.is_main ? "currentColor" : "none"} />
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
                      <div
                        key={`new-${i}`}
                        className="relative aspect-square overflow-hidden rounded-xl bg-stone-200 group"
                      >
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
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

            {imageFiles.length === 0 && existingImages.length === 0 && (
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
              {isSaving ? (
                <Loader2 className="animate-spin" size={24} />
              ) : isEditing ? (
                "Confirmer les modifications"
              ) : (
                "Confirmer"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
