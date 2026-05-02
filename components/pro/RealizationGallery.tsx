"use client";

import Image from "next/image";

interface RealizationGalleryProps {
  photoUrls: string[];
  projectTitle: string;
}

export function RealizationGallery({
  photoUrls,
  projectTitle,
}: RealizationGalleryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {photoUrls.map((url, index) => (
        <div
          key={index}
          className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-container-low"
        >
          <Image
            src={url}
            alt={`${projectTitle} - Photo ${index + 1}`}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ))}
    </div>
  );
}
