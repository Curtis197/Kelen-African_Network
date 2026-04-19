"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import { Image as ImageIcon, X, Loader2, ArrowLeft, Star, FileText, Upload, Video, Sparkles, RotateCcw } from "lucide-react";
import { correctRealizationText } from "@/lib/actions/realization-copy";
import Link from "next/link";
import { toast } from "sonner";
import { createRealization, updateRealization } from "@/lib/actions/portfolio";
import { LocationSearch, type LocationData } from "@/components/location/LocationSearch";

const realizationSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  location: z.string().optional(),
  completion_date: z.string().optional(),
  price: z.string().optional(),
  currency: z.string().default("XOF"),
});

type RealizationFormData = z.infer<typeof realizationSchema>;

interface RealizationFormProps {
  professionalId: string;
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    completion_date: string | null;
    price: number | null;
    currency: string;
    images?: Array<{ id: string; url: string; is_main: boolean }>;
    videos?: Array<{ id: string; url: string; thumbnail_url: string | null; duration: number | null }>;
    documents?: Array<{ id: string; url: string; title: string | null; type: string | null }>;
  };
}

export function RealizationForm({ professionalId, initialData }: RealizationFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    Array<{ id: string; url: string; is_main: boolean }>
  >(initialData?.images || []);
  const [existingVideos, setExistingVideos] = useState<
    Array<{ id: string; url: string; thumbnail_url: string | null; duration: number | null }>
  >(initialData?.videos || []);
  const [existingDocuments, setExistingDocuments] = useState<
    Array<{ id: string; url: string; title: string | null; type: string | null }>
  >(initialData?.documents || []);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [removedVideoIds, setRemovedVideoIds] = useState<string[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const supabase = createClient();

  const isEditing = !!initialData?.id;
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [lastCorrectionSnapshot, setLastCorrectionSnapshot] = useState<{ title: string; description: string } | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RealizationFormData>({
    resolver: zodResolver(realizationSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description || "",
          location: initialData.location || "",
          completion_date: initialData.completion_date || "",
          price: initialData.price ? String(initialData.price) : "",
          currency: initialData.currency || "XOF",
        }
      : {
          title: "",
          description: "",
          location: "",
          completion_date: "",
          price: "",
          currency: "XOF",
        },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setVideoFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocumentFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    if (isEditing) {
      setRemovedImageIds((prev) => [...prev, imageId]);
      const { error } = await supabase
        .from("realization_images")
        .delete()
        .eq("id", imageId);
      if (error) {
        console.error("[RealizationForm] Error deleting image:", error);
        toast.error("Erreur lors de la suppression de l'image");
      }
    }
  };

  const removeExistingVideo = async (videoId: string) => {
    setExistingVideos((prev) => prev.filter((v) => v.id !== videoId));
    if (isEditing) {
      setRemovedVideoIds((prev) => [...prev, videoId]);
      const { error } = await supabase
        .from("realization_videos")
        .delete()
        .eq("id", videoId);
      if (error) {
        console.error("[RealizationForm] Error deleting video:", error);
        toast.error("Erreur lors de la suppression de la vidéo");
      }
    }
  };

  const removeExistingDocument = async (docId: string) => {
    setExistingDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (isEditing) {
      setRemovedDocumentIds((prev) => [...prev, docId]);
      const { error } = await supabase
        .from("realization_documents")
        .delete()
        .eq("id", docId);
      if (error) {
        console.error("[RealizationForm] Error deleting document:", error);
        toast.error("Erreur lors de la suppression du document");
      }
    }
  };

  const setFeaturedImage = (url: string) => {
    setExistingImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_main: img.url === url,
      }))
    );
  };

  async function handleCorrect() {
    const currentTitle = watch("title");
    const currentDescription = watch("description") ?? "";
    if (!currentTitle) return;
    setIsCorrecting(true);
    setCorrectionError(null);
    try {
      const { corrected } = await correctRealizationText({ title: currentTitle, description: currentDescription });
      setLastCorrectionSnapshot({ title: currentTitle, description: currentDescription });
      setValue("title", corrected.title, { shouldDirty: true });
      setValue("description", corrected.description, { shouldDirty: true });
    } catch {
      setCorrectionError("Erreur lors de la correction IA. Réessayez.");
    } finally {
      setIsCorrecting(false);
    }
  }

  function handleUndoCorrection() {
    if (!lastCorrectionSnapshot) return;
    setValue("title", lastCorrectionSnapshot.title, { shouldDirty: true });
    setValue("description", lastCorrectionSnapshot.description, { shouldDirty: true });
    setLastCorrectionSnapshot(null);
  }

  const onSubmit = async (data: RealizationFormData) => {
    setIsSaving(true);
    console.log("[RealizationForm] Submitting:", { isEditing, data, existingImagesCount: existingImages.length, newImagesCount: imageFiles.length, existingVideosCount: existingVideos.length, newVideosCount: videoFiles.length });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Upload new images
      const newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const uploads = imageFiles.map(async (file) => {
          const path = `portfolios/${user.id}`;
          const url = await uploadFile(file, "portfolios", path);
          return url;
        });
        const results = await Promise.all(uploads);
        newImageUrls.push(...results.filter(Boolean));
      }

      // Upload new video files
      const newVideoUrls: string[] = [];
      if (videoFiles.length > 0) {
        console.log("[RealizationForm] Uploading videos...", videoFiles.length);
        const uploads = videoFiles.map(async (file) => {
          const path = `portfolios/${user.id}/videos`;
          const url = await uploadFile(file, "portfolios", path);
          return url;
        });
        const results = await Promise.all(uploads);
        newVideoUrls.push(...results.filter(Boolean));
        console.log("[RealizationForm] Videos uploaded:", newVideoUrls.length);
      }

      // Upload new document files
      const newDocFiles: { url: string; title: string | null; type: string | null }[] = [];
      if (documentFiles.length > 0) {
        const uploads = documentFiles.map(async (file) => {
          const path = `portfolios/${user.id}/docs`;
          const url = await uploadFile(file, "portfolios", path);
          return { url, title: file.name.split(".")[0], type: file.type };
        });
        const results = await Promise.all(uploads);
        newDocFiles.push(...results.filter(Boolean));
      }

      // Collect updated image data (including is_main flags)
      const updatedImages = existingImages.map((img) => ({
        id: img.id,
        url: img.url,
        is_main: img.is_main,
      }));

      if (isEditing) {
        await updateRealization(initialData!.id, {
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          completion_date: data.completion_date || null,
          price: data.price ? parseFloat(data.price) : null,
          currency: data.currency,
          image_urls: newImageUrls,
          video_urls: newVideoUrls,
          document_files: newDocFiles,
          removed_image_ids: removedImageIds,
          removed_video_ids: removedVideoIds,
          removed_document_ids: removedDocumentIds,
          updated_images: updatedImages,
        });
        toast.success("Réalisation mise à jour avec succès");
      } else {
        await createRealization({
          professional_id: professionalId,
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          completion_date: data.completion_date || null,
          price: data.price ? parseFloat(data.price) : null,
          currency: data.currency,
          image_urls: newImageUrls,
          video_urls: newVideoUrls,
          document_files: newDocFiles.length > 0 ? newDocFiles : undefined,
        });
        toast.success("Réalisation ajoutée avec succès");
      }

      router.push("/pro/portfolio");
      router.refresh();
    } catch (error) {
      console.error("[RealizationForm] Error:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
      <div className="flex items-center justify-between border-b border-transparent pb-6">
        <Link
          href="/pro/portfolio"
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={16} />
          Retour au portfolio
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left: Details */}
        <div className="space-y-8 lg:col-span-7">
          <section className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                {isEditing ? "Modifier la réalisation" : "Détails de la réalisation"}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                {lastCorrectionSnapshot && (
                  <button
                    type="button"
                    onClick={handleUndoCorrection}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Annuler
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCorrect}
                  disabled={isCorrecting || !watch("title")}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
                >
                  {isCorrecting
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" />
                  }
                  {isCorrecting ? "Correction..." : "Améliorer avec l'IA"}
                </button>
              </div>
            </div>
            {correctionError && <p className="text-sm text-red-600">{correctionError}</p>}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Titre</label>
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Localisation</label>
                  <LocationSearch
                    value={watch("location") ? { name: watch("location") || "", formatted_address: watch("location") || "", lat: 0, lng: 0 } : null}
                    onChange={(loc: LocationData | null) => setValue("location", loc?.formatted_address || "")}
                    placeholder="Ex: Abidjan, Côte d'Ivoire"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Date de réalisation</label>
                  <input
                    type="date"
                    {...register("completion_date")}
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Prix (optionnel)</label>
                  <input
                    type="number"
                    {...register("price")}
                    placeholder="Ex: 5000000"
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface">Devise</label>
                  <select
                    {...register("currency")}
                    className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm transition-all focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 outline-none"
                  >
                    <option value="XOF">XOF — Franc CFA</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar US</option>
                  </select>
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
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : isEditing ? "Confirmer les modifications" : "Confirmer"}
            </button>
          </div>
        </div>

        {/* Right: Media */}
        <div className="space-y-8 lg:col-span-5">
          {/* Photos Section */}
          <section className="space-y-4 rounded-[1.5rem] bg-surface-container-low p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <ImageIcon size={18} className="text-kelen-green-600" />
                Photos
              </h3>
              <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-on-surface shadow-sm transition-all hover:bg-stone-50">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                Ajouter
              </label>
            </div>

            {isEditing && existingImages.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-on-surface-variant">Photos existantes :</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((img) => (
                    <div key={`existing-${img.id}`} className="relative aspect-square overflow-hidden rounded-xl bg-stone-200 group">
                      <img src={img.url} alt="Photo" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFeaturedImage(img.url)}
                        className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all ${
                          img.is_main ? "bg-kelen-green-500 text-white" : "bg-white/90 text-stone-600 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <Star size={12} fill={img.is_main ? "currentColor" : "none"} />
                      </button>
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

            {imageFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-on-surface-variant">Nouvelles photos :</p>
                <div className="grid grid-cols-3 gap-3">
                  {imageFiles.map((file, i) => {
                    const previewUrl = URL.createObjectURL(file);
                    return (
                      <div key={`new-${i}`} className="relative aspect-square overflow-hidden rounded-xl bg-stone-200 group">
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
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

          {/* Videos Section */}
          <section className="space-y-4 rounded-[1.5rem] bg-surface-container-low p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <Video size={18} className="text-kelen-green-600" />
                Vidéos
              </h3>
              <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-on-surface shadow-sm transition-all hover:bg-stone-50">
                <input type="file" multiple accept="video/mp4,video/webm" className="hidden" onChange={handleVideoChange} />
                Ajouter
              </label>
            </div>

            <p className="text-xs text-on-surface-variant/60">
              Vidéos de démonstration (MP4, WebM - max 50 Mo par vidéo).
            </p>

            {isEditing && existingVideos.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-on-surface-variant">Vidéos existantes :</p>
                <div className="grid grid-cols-2 gap-3">
                  {existingVideos.map((video) => (
                    <div key={`existing-video-${video.id}`} className="relative aspect-video overflow-hidden rounded-xl bg-stone-900 group">
                      <video src={video.url} className="h-full w-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 rounded-full p-2">
                          <Video size={20} className="text-white" />
                        </div>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingVideo(video.id)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kelen-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videoFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-on-surface-variant">Nouvelles vidéos :</p>
                <div className="grid grid-cols-2 gap-3">
                  {videoFiles.map((file, i) => {
                    const previewUrl = URL.createObjectURL(file);
                    return (
                      <div key={`new-video-${i}`} className="relative aspect-video overflow-hidden rounded-xl bg-stone-900 group">
                        <video src={previewUrl} className="h-full w-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/60 rounded-full p-2">
                            <Video size={20} className="text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded truncate">
                          {file.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVideo(i)}
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

            {videoFiles.length === 0 && existingVideos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-on-surface-variant/10 rounded-xl">
                <Video size={32} className="mb-2 text-on-surface-variant/20" />
                <p className="text-xs text-on-surface-variant/50">Aucune vidéo ajoutée</p>
              </div>
            )}
          </section>

          {/* Documents Section */}
          <section className="space-y-4 rounded-[1.5rem] bg-surface-container-low p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <FileText size={18} className="text-kelen-green-600" />
                Documents (optionnel)
              </h3>
              <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-on-surface shadow-sm transition-all hover:bg-stone-50">
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={handleDocumentChange} />
                <Upload size={14} />
              </label>
            </div>

            <p className="text-xs text-on-surface-variant/60">
              Plans, certificats, ou tout document à afficher sur le portfolio.
            </p>

            {isEditing && existingDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-on-surface-variant">Documents existants :</p>
                {existingDocuments.map((doc) => (
                  <div key={`existing-doc-${doc.id}`} className="flex items-center justify-between rounded-lg bg-white p-3 group">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-on-surface-variant/50 flex-shrink-0" />
                      <span className="text-xs text-on-surface truncate">{doc.title || "Document"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingDocument(doc.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-kelen-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {documentFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-on-surface-variant">Nouveaux documents :</p>
                {documentFiles.map((file, i) => (
                  <div key={`new-doc-${i}`} className="flex items-center justify-between rounded-lg bg-white p-3 group">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-on-surface-variant/50 flex-shrink-0" />
                      <span className="text-xs text-on-surface truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(i)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-kelen-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {documentFiles.length === 0 && existingDocuments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-on-surface-variant/10 rounded-xl">
                <FileText size={28} className="mb-2 text-on-surface-variant/20" />
                <p className="text-xs text-on-surface-variant/50">Aucun document ajouté</p>
              </div>
            )}
          </section>

          <div className="hidden lg:block pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 py-5 font-headline text-base font-bold text-white shadow-xl shadow-kelen-green-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={24} /> : isEditing ? "Confirmer les modifications" : "Confirmer"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
