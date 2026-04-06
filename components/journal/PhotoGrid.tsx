'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LogMedia } from '@/lib/types/daily-logs';

interface PhotoGridProps {
  photos: LogMedia[];
  signedUrls: Record<string, string>; // storage_path -> signed URL
}

export default function PhotoGrid({ photos, signedUrls }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => prev !== null && prev < photos.length - 1 ? prev + 1 : 0);
  const prevPhoto = () => setLightboxIndex(prev => prev !== null && prev > 0 ? prev - 1 : photos.length - 1);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, index) => {
          const url = signedUrls[photo.storage_path] || photo.preview_url;
          if (!url) return null;

          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => openLightbox(index)}
              className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-low hover:opacity-90 transition-opacity cursor-pointer"
              aria-label={`Voir ${photo.caption || photo.file_name}`}
            >
              <img
                src={url}
                alt={photo.caption || photo.file_name}
                className="w-full h-full object-cover"
              />
              {photo.is_primary && (
                <div className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-primary text-on-primary rounded-md">
                  ★ Principale
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse de photos"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 p-2 text-white/80 hover:text-white z-10"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          {signedUrls[photos[lightboxIndex].storage_path] && (
            <img
              src={signedUrls[photos[lightboxIndex].storage_path]}
              alt={photos[lightboxIndex].caption || photos[lightboxIndex].file_name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 p-2 text-white/80 hover:text-white z-10"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
