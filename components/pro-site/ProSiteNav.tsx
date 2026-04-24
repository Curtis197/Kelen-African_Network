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

  const linkClass = scrolled
    ? 'text-sm font-medium text-[#1A1A1A] hover:text-kelen-green-700 transition-colors no-underline'
    : 'text-sm font-medium text-white/85 hover:text-white transition-colors no-underline'

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1160px] mx-auto px-4 sm:px-8 py-4 flex items-center gap-6 sm:gap-10">
        {/* Brand */}
        <a href="#top" className="inline-flex items-center gap-3 no-underline text-inherit mr-auto">
          <span className="w-9 h-9 inline-flex items-center justify-center bg-kelen-green-700 text-white font-headline font-extrabold text-sm rounded-lg tracking-wide shadow-[0_2px_8px_rgba(0,97,36,0.35)]">
            {monogram}
          </span>
          <div className="flex flex-col leading-tight">
            <span className={`font-headline font-bold text-[15px] tracking-tight transition-colors duration-300 ${scrolled ? 'text-[#1A1A1A]' : 'text-white'}`}>{proName}</span>
            {role && <span className={`text-xs mt-0.5 transition-colors duration-300 ${scrolled ? 'text-stone-500' : 'text-white/70'}`}>{role}</span>}
          </div>
        </a>

        {/* Anchor links */}
        <div className="hidden md:flex gap-7">
          <a href="#about" className={linkClass}>À propos</a>
          {showServices && <a href="#services" className={linkClass}>Services</a>}
          {showRealisations && <a href="#portfolio" className={linkClass}>Réalisations</a>}
          {showProduits && <a href="#produits" className={linkClass}>Produits</a>}
          <a href="#reviews" className={linkClass}>Avis</a>
          <a href="#contact" className={linkClass}>Contact</a>
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-b from-kelen-green-600 to-kelen-green-700 hover:from-kelen-green-700 hover:to-kelen-green-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 no-underline shadow-[0_2px_8px_rgba(0,97,36,0.3)] active:scale-[0.97]"
        >
          Contact
        </a>
      </div>
    </nav>
  )
}
