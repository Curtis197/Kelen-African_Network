// components/pro-site/ProSiteGallery.tsx
'use client'
import { useState } from 'react'

export function ProSiteGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (images.length === 0) return null

  return (
    <section className="bg-[var(--pro-surface,#fff)] px-6 py-6 border-t border-[var(--pro-border,#eee)]">
      <h3 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-3">
        Photos <span className="font-normal text-[var(--pro-text-muted,#888)]">· {images.length}</span>
      </h3>
      <div className="grid grid-cols-3 gap-2" style={{ gridTemplateRows: 'auto auto' }}>
        <img
          src={images[0]}
          alt=""
          className="col-span-1 row-span-2 w-full h-full object-cover rounded-[var(--pro-radius,16px)] cursor-pointer"
          style={{ gridColumn: '1', gridRow: '1 / 3', maxHeight: '240px' }}
          onClick={() => setLightbox(images[0])}
        />
        {images.slice(1, 5).map((src, i) => (
          <div key={i} className="relative">
            <img
              src={src}
              alt=""
              className="w-full h-28 object-cover rounded-[var(--pro-radius,16px)] cursor-pointer"
              onClick={() => setLightbox(src)}
            />
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/50 rounded-[var(--pro-radius,16px)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">+{images.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </section>
  )
}
