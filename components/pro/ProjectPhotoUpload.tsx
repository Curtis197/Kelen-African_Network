"use client";

import { useState, useCallback, useRef } from "react";
import { ImagePlus, X, Upload, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";

interface ProjectPhotoUploadProps {
  photoUrls: string[];
  featuredPhoto: string | null;
  onPhotosChange: (urls: string[]) => void;
  onFeaturedPhotoChange: (url: string | null) => void;
}

export function ProjectPhotoUpload({
  photoUrls,
  featuredPhoto,
  onPhotosChange,
  onFeaturedPhotoChange,
}: ProjectPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    console.log("[ProjectPhotoUpload] uploadPhoto called", { fileName: file.name, fileSize: file.size });

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      const errorMsg = `${file.name} n'est pas un format supporté (JPEG, PNG, WebP)`;
      console.log("[ProjectPhotoUpload] Invalid file type", { fileName: file.name, type: file.type });
      setError(errorMsg);
      return null;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = `${file.name} dépasse 10MB`;
      console.log("[ProjectPhotoUpload] File too large", { fileName: file.name, fileSize: file.size });
      setError(errorMsg);
      return null;
    }

    try {
      setUploading(true);
      console.log("[ProjectPhotoUpload] Starting upload to Supabase storage");

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = await createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const errorMsg = "Vous devez être connecté pour uploader des photos";
        console.log("[ProjectPhotoUpload] No user found");
        setError(errorMsg);
        return null;
      }

      // Create unique file path with user ID prefix (required by RLS policy)
      // Path structure: <user_id>/<uuid>.ext
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("[ProjectPhotoUpload] Uploading to storage", { bucket: "portfolios", path: filePath });

      const { error: uploadError } = await supabase.storage
        .from("portfolios")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.log("[ProjectPhotoUpload] Upload error", { 
          error: uploadError.message,
          statusCode: uploadError.statusCode 
        });
        
        // Provide more specific error message for RLS violations
        if (uploadError.message.includes("row-level security")) {
          setError("Erreur de permissions. Vérifiez que vous êtes connecté et avez les droits d'upload.");
        } else {
          setError(uploadError.message);
        }
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("portfolios")
        .getPublicUrl(filePath);

      console.log("[ProjectPhotoUpload] Upload successful", { publicUrl: urlData.publicUrl });
      return urlData.publicUrl;
    } catch (err) {
      const errorMsg = "Erreur lors de l'upload de la photo";
      console.log("[ProjectPhotoUpload] Unexpected error", err);
      setError(errorMsg);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      console.log("[ProjectPhotoUpload] processFiles called", { fileCount: files.length });
      setError(null);

      const newUrls: string[] = [...photoUrls];

      for (const file of Array.from(files)) {
        const url = await uploadPhoto(file);
        if (url) {
          newUrls.push(url);
        }
      }

      console.log("[ProjectPhotoUpload] processFiles complete", { totalPhotos: newUrls.length });
      onPhotosChange(newUrls);

      // Auto-set first photo as featured if none set
      if (!featuredPhoto && newUrls.length > 0) {
        console.log("[ProjectPhotoUpload] Auto-setting first photo as featured");
        onFeaturedPhotoChange(newUrls[0]);
      }
    },
    [photoUrls, featuredPhoto, uploadPhoto, onPhotosChange, onFeaturedPhotoChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removePhoto = useCallback(
    (url: string) => {
      console.log("[ProjectPhotoUpload] removePhoto", { url, isFeatured: featuredPhoto === url });
      const newUrls = photoUrls.filter((u) => u !== url);
      onPhotosChange(newUrls);

      // If removed photo was featured, clear featured or set to first available
      if (featuredPhoto === url) {
        onFeaturedPhotoChange(newUrls.length > 0 ? newUrls[0] : null);
      }
    },
    [photoUrls, featuredPhoto, onPhotosChange, onFeaturedPhotoChange]
  );

  const setFeatured = useCallback(
    (url: string) => {
      console.log("[ProjectPhotoUpload] setFeatured", { url });
      onFeaturedPhotoChange(url);
    },
    [onFeaturedPhotoChange]
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-on-surface flex items-center gap-2">
        <ImagePlus className="w-4 h-4" />
        Photos du projet
      </label>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-outline-variant/40 hover:border-outline-variant/60 bg-surface-container-lowest"
          }
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
        role="button"
        tabIndex={0}
        aria-label="Zone de téléchargement de photos"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) inputRef.current?.click();
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-on-surface-variant">Upload en cours...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-3 h-8 w-8 text-on-surface-variant/40" />
            <p className="mb-1 text-sm text-on-surface-variant">Glissez vos photos ici ou cliquez</p>
            <p className="text-xs text-on-surface-variant/60">JPEG, PNG, WebP — max 10MB par photo</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Choisir des fichiers
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Sélectionner des photos"
        disabled={uploading}
      />

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {/* Photo grid */}
      {photoUrls.length > 0 && (
        <div>
          <p className="mb-3 text-xs text-on-surface-variant">
            {photoUrls.length} photo{photoUrls.length > 1 ? "s" : ""} — Cliquez sur ★ pour définir la photo principale
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photoUrls.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-container-low">
                <img src={url} alt="Project photo" className="h-full w-full object-cover" />

                {/* Overlay actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {featuredPhoto !== url && (
                    <button
                      type="button"
                      onClick={() => setFeatured(url)}
                      className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-stone-900 hover:bg-white"
                      aria-label="Définir comme photo principale"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="rounded-md bg-red-500/90 p-1.5 text-white hover:bg-red-500"
                    aria-label="Supprimer la photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Featured badge */}
                {featuredPhoto === url && (
                  <div className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary">
                    <Star className="w-3 h-3 inline mr-1" />
                    Principale
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
