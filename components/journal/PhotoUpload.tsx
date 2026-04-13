'use client';

import { useState, useCallback, useRef } from 'react';
import { ImagePlus, X, Camera, Upload, AlertCircle } from 'lucide-react';
import exifr from 'exifr';
import type { LogMedia } from '@/lib/types/daily-logs';

interface PhotoUploadProps {
  photos: LogMedia[];
  photoFiles: File[];
  onPhotosChange: (photos: LogMedia[]) => void;
  onPhotoFilesChange: (files: File[]) => void;
  onEXIFGPS?: (lat: number, lng: number) => void;
}

export default function PhotoUpload({ photos, photoFiles, onPhotosChange, onPhotoFilesChange, onEXIFGPS }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const newPhotos: LogMedia[] = [];
    const newFiles: File[] = [];

    for (const file of Array.from(files)) {
      // Validate type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(`${file.name} n'est pas un format supporté (JPEG, PNG, WebP)`);
        continue;
      }

      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} dépasse 10MB`);
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Extract EXIF data
      let exifLat: number | null = null;
      let exifLng: number | null = null;
      let exifTimestamp: string | null = null;

      try {
        const exifData = await exifr.parse(file, {
          gps: true,
          tiff: true,
        });

        if (exifData?.latitude && exifData?.longitude) {
          exifLat = exifData.latitude;
          exifLng = exifData.longitude;

          // Notify parent of EXIF GPS
          if (onEXIFGPS && exifLat !== null && exifLng !== null) {
            onEXIFGPS(exifLat, exifLng);
          }
        }

        if (exifData?.DateTimeOriginal) {
          exifTimestamp = exifData.DateTimeOriginal.toISOString();
        }
      } catch {
        // No EXIF data - continue without it
      }

      const tempId = crypto.randomUUID();
      const photo: LogMedia = {
        id: tempId,
        log_id: '',
        media_type: 'photo',
        storage_path: '',
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        caption: null,
        exif_latitude: exifLat,
        exif_longitude: exifLng,
        exif_timestamp: exifTimestamp,
        is_primary: photos.length + newPhotos.length === 0,
        created_at: new Date().toISOString(),
        preview_url: previewUrl,
      };

      newPhotos.push(photo);
      newFiles.push(file);
    }

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos]);
      onPhotoFilesChange([...photoFiles, ...newFiles]);
    }
  }, [photos, photoFiles, onPhotosChange, onPhotoFilesChange, onEXIFGPS]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removePhoto = useCallback((id: string) => {
    const photo = photos.find(p => p.id === id);
    if (photo?.preview_url) {
      URL.revokeObjectURL(photo.preview_url);
    }
    // Find index to remove from both arrays
    const index = photos.findIndex(p => p.id === id);
    if (index !== -1) {
      onPhotosChange(photos.filter(p => p.id !== id));
      onPhotoFilesChange(photoFiles.filter((_, i) => i !== index));
    }
  }, [photos, photoFiles, onPhotosChange, onPhotoFilesChange]);

  const setPrimary = useCallback((id: string) => {
    onPhotosChange(photos.map(p => ({
      ...p,
      is_primary: p.id === id,
    })));
  }, [photos, onPhotosChange]);

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-on-surface flex items-center gap-2">
        <ImagePlus className="w-4 h-4" />
        Photos du chantier
      </label>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant/40 hover:border-outline-variant/60 bg-surface-container-lowest'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="Zone de téléchargement de photos"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-on-surface-variant/40" />
        <p className="text-sm text-on-surface-variant mb-1">
          Glissez vos photos ici ou cliquez
        </p>
        <p className="text-xs text-on-surface-variant/60">
          JPEG, PNG, WebP — max 10MB par photo
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Prendre une photo
          </button>
          <span className="text-xs text-on-surface-variant/40">ou</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-surface-container text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Choisir des fichiers
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Sélectionner des photos"
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-xl overflow-hidden bg-surface-container-low"
            >
              {photo.preview_url ? (
                <img
                  src={photo.preview_url}
                  alt={photo.caption || `Photo ${photo.file_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-on-surface-variant/40" />
                </div>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(photo.id)}
                    className="px-2 py-1 text-xs font-medium bg-white/90 text-stone-900 rounded-md hover:bg-white"
                    aria-label="Définir comme photo principale"
                  >
                    ★ Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="p-1.5 bg-red-500/90 text-white rounded-md hover:bg-red-500"
                  aria-label="Supprimer la photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Primary badge */}
              {photo.is_primary && (
                <div className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-primary text-on-primary rounded-md">
                  ★ Principale
                </div>
              )}

              {/* EXIF GPS indicator */}
              {photo.exif_latitude && photo.exif_longitude && (
                <div className="absolute top-2 right-2 p-1 bg-green-500/90 rounded-md" title="GPS confirmé">
                  <span className="text-xs">✅</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
