'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function ProSiteNav({
  slug,
  proName,
  role,
  showServices,
  showRealisations,
  showProduits,
  calendarUrl,
  basePath,
}: {
  slug: string
  proName: string
  role?: string | null
  showServices: boolean
  showRealisations: boolean
  showProduits: boolean
  calendarUrl: string | null
  basePath?: string
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const base = basePath ?? `/professionnels/${slug}`
  const monogram = proName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-all duration-200 ${
        scrolled ? 'border-b border-stone-200 shadow-[0_1px_0_rgba(0,0,0,0.02)]' : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-[1160px] mx-auto px-8 py-4 flex items-center gap-10">
        {/* Brand */}
        <a href="#top" className="inline-flex items-center gap-3 no-underline text-inherit mr-auto">
          <span className="w-9 h-9 inline-flex items-center justify-center bg-kelen-green-700 text-white font-headline font-extrabold text-sm rounded-lg tracking-wide">
            {monogram}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-headline font-bold text-[15px] text-[#1A1A1A] tracking-tight">{proName}</span>
            {role && <span className="text-xs text-stone-500 mt-0.5">{role}</span>}
          </div>
        </a>

        {/* Anchor links */}
        <div className="hidden md:flex gap-7">
          <a href="#about" className="text-sm font-medium text-[#1A1A1A] hover:text-kelen-green-700 transition-colors no-underline">À propos</a>
          {showServices && (
            <a href="#services" className="text-sm font-medium text-[#1A1A1A] hover:text-kelen-green-700 transition-colors no-underline">Services</a>
          )}
          {showRealisations && (
            <a href="#portfolio" className="text-sm font-medium text-[#1A1A1A] hover:text-kelen-green-700 transition-colors no-underline">Réalisations</a>
          )}
          {showProduits && (
            <a href="#produits" className="text-sm font-medium text-[#1A1A1A] hover:text-kelen-green-700 transition-colors no-underline">Produits</a>
          )}
          <a href="#reviews" className="text-sm font-medium text-[#1A1A1A] hover:text-kelen-green-700 transition-colors no-underline">Avis</a>
          <a href="#contact" className="text-sm font-medium text-[#1A1A1A] hover:text-kelen-green-700 transition-colors no-underline">Contact</a>
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-kelen-green-700 hover:bg-kelen-green-800 text-white text-sm font-semibold rounded-lg transition-colors no-underline"
        >
          Contact
        </a>
      </div>
    </nav>
  )
}
