import Link from 'next/link'

export function ProSiteFooter({
  proName,
  phone,
  email,
  slug,
}: {
  proName: string
  phone?: string | null
  email?: string | null
  slug?: string
}) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#FAFAF9] border-t border-stone-100">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-8">
        {/* Responsive grid: 2-col on mobile, 4-col on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 pt-12 pb-10">
          {/* Col 1 — Studio */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-2.5">
            <div className="font-headline font-bold text-[16px] text-[#1A1A1A] tracking-tight">
              {proName}
            </div>
            <div className="mt-3">
              <span className="font-headline font-extrabold text-[20px] text-kelen-green-700 tracking-[-0.02em]">
                Kelen
              </span>
              <p className="text-[13px] text-stone-500 leading-[1.55] mt-1.5">
                Profil hébergé par{' '}
                <Link href="/" className="text-kelen-green-700 font-semibold hover:underline underline-offset-3">
                  Kelen
                </Link>{' '}
                · Réseau de professionnels vérifiés en Afrique.
              </p>
            </div>
          </div>

          {/* Col 2 — Contact */}
          <div className="flex flex-col gap-2.5">
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#1A1A1A] mb-1">
              Contact
            </div>
            {phone && (
              <a href={`tel:${phone}`} className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline break-all">
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline break-all">
                {email}
              </a>
            )}
          </div>

          {/* Col 3 — Liens */}
          <div className="flex flex-col gap-2.5">
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#1A1A1A] mb-1">
              Liens
            </div>
            <a href="#about" className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline">À propos</a>
            <a href="#portfolio" className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline">Réalisations</a>
            <a href="#services" className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline">Services</a>
            <a href="#contact" className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline">Contact</a>
          </div>

          {/* Col 4 — Réseaux */}
          <div className="flex flex-col gap-2.5">
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#1A1A1A] mb-1">
              Réseaux
            </div>
            <a href="#" className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline">LinkedIn</a>
            <a href="#" className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline">Instagram</a>
            <a href="#" className="text-sm text-stone-500 hover:text-kelen-green-700 transition-colors no-underline">Facebook</a>
          </div>
        </div>
      </div>

      {/* Bar */}
      <div className="border-t border-stone-100">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-stone-400">
          <span>© {year} {proName} · Tous droits réservés</span>
          <span className="flex gap-3">
            <a href="#" className="hover:text-kelen-green-700 transition-colors no-underline">Mentions légales</a>
            <span>·</span>
            <a href="#" className="hover:text-kelen-green-700 transition-colors no-underline">Politique de confidentialité</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
