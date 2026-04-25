"use client";

import { useState, useCallback, useRef } from "react";
import { ImagePlus, X, Upload, AlertCircle, Star } from "lucide-react";

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
    try {
      setUploading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Vous devez être connecté pour uploader des photos");
        return null;
      }
      const { uploadFile } = await import("@/lib/supabase/storage");
      return await uploadFile(file, "portfolios", user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload de la photo");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);

      const newUrls: string[] = [...photoUrls];

      for (const file of Array.from(files)) {
        const url = await uploadPhoto(file);
        if (url) {
          newUrls.push(url);
        }
      }

      onPhotosChange(newUrls);

      if (!featuredPhoto && newUrls.length > 0) {
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
            <p className="text-sm text-on-surface-variant">Compression et envoi en cours...</p>
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
