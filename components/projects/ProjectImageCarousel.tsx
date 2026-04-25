"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ProjectImageCarouselProps {
  images: Array<{
    id: string;
    url: string;
    is_main: boolean;
  }>;
  projectId: string;
}

export function ProjectImageCarousel({ images, projectId }: ProjectImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log('[CAROUSEL] Render, images:', images.length, 'currentIndex:', currentIndex);

  if (!images || images.length === 0) {
    console.log('[CAROUSEL] No images to display');
    return null;
  }

  const goToPrevious = () => {
    console.log('[CAROUSEL] Going to previous image');
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    console.log('[CAROUSEL] Going to next image');
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    console.log('[CAROUSEL] Going to slide:', index);
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full bg-white rounded-xl border border-border overflow-hidden">
      {/* Main Image Display */}
      <div className="relative aspect-video bg-surface-container-lowest flex items-center justify-center">
        <Image
          src={images[currentIndex].url}
          alt={`Image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          onError={(e) => {
            console.error('[CAROUSEL] Failed to load image:', images[currentIndex].url);
          }}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/50 text-white text-sm font-medium rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Main Image Badge */}
        {images[currentIndex].is_main && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-kelen-green-600 text-white text-xs font-bold rounded-full">
            Principale
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-3 bg-surface-container-lowest border-t border-border">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === index
                    ? 'border-kelen-green-600 ring-2 ring-kelen-green-600/20'
                    : 'border-border hover:border-on-surface-variant'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                  onError={(e) => {
                    console.error('[CAROUSEL] Failed to load thumbnail:', image.url);
                  }}
                />
                {image.is_main && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-kelen-green-600 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
