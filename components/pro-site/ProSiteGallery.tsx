// components/pro-site/ProSiteGallery.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'

export function ProSiteGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (images.length === 0) return null

  return (
    <section className="bg-[var(--pro-surface,#fff)] px-6 py-6 border-t border-[var(--pro-border,#eee)]">
      <h3 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-3">
        Photos <span className="font-normal text-[var(--pro-text-muted,#888)]">· {images.length}</span>
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <div 
          className="col-span-1 row-span-2 relative min-h-[240px] cursor-pointer group"
          onClick={() => setLightbox(images[0])}
        >
          <Image
            src={images[0]}
            alt="Gallery focus image"
            fill
            className="object-cover rounded-[var(--pro-radius,16px)] transition-opacity group-hover:opacity-90"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>
        {images.slice(1, 5).map((src, i) => (
          <div key={i} className="relative h-28 cursor-pointer group" onClick={() => setLightbox(src)}>
            <Image
              src={src}
              alt={`Gallery image ${i + 1}`}
              fill
              className="object-cover rounded-[var(--pro-radius,16px)] transition-opacity group-hover:opacity-90"
              sizes="(max-width: 768px) 33vw, 20vw"
            />
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 rounded-[var(--pro-radius,16px)] flex items-center justify-center pointer-events-none">
                <span className="text-white font-bold text-sm">+{images.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full h-full">
            <Image 
              src={lightbox} 
              alt="Lightbox view" 
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </section>
  )
}
