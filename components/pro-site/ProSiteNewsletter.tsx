'use client'
import { useState } from 'react'

export function ProSiteNewsletter({
  proName,
  whatsapp,
}: {
  professionalId: string
  proName: string
  whatsapp?: string | null
}) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  const waNumber = whatsapp?.replace(/\D/g, '') ?? null

  return (
    <section className="py-14 md:py-[88px] border-t border-stone-100 bg-stone-50" id="follow">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-8">
        <div className="mb-12">
          <span className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500 mb-3">
            <span className="w-4 h-0.5 bg-kelen-green-600 rounded-full" />
            NOUS SUIVRE
          </span>
          <h2 className="font-headline font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-[#1A1A1A]">
            Restez informé de nos actualités.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Newsletter */}
          <div className="bg-white border border-stone-100 rounded-xl p-6 sm:p-8 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
            <div className="w-11 h-11 rounded-xl bg-kelen-green-50 text-kelen-green-700 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3 className="font-headline font-bold text-[20px] text-[#1A1A1A] tracking-[-0.01em]">Newsletter</h3>
            <p className="text-[15px] text-stone-500 leading-[1.6] flex-1">
              Recevez les actualités et nouveaux projets de {proName} directement par email.
            </p>
            {submitted ? (
              <p className="text-sm font-semibold text-kelen-green-700">Merci pour votre inscription !</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 min-w-0 text-sm px-3 py-2.5 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-kelen-green-600 focus:ring-2 focus:ring-kelen-green-600/20 transition"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-gradient-to-b from-kelen-green-600 to-kelen-green-700 hover:from-kelen-green-700 hover:to-kelen-green-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.97]"
                >
                  S&apos;abonner
                </button>
              </form>
            )}
          </div>

          {/* Social */}
          <div className="bg-white border border-stone-100 rounded-xl p-6 sm:p-8 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
            <div className="w-11 h-11 rounded-xl bg-kelen-green-50 text-kelen-green-700 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </div>
            <h3 className="font-headline font-bold text-[20px] text-[#1A1A1A] tracking-[-0.01em]">Réseaux sociaux</h3>
            <p className="text-[15px] text-stone-500 leading-[1.6] flex-1">
              Suivez {proName} pour découvrir les coulisses et les inspirations.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              {[
                { label: 'LinkedIn', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.93-2.06-2.06s.93-2.06 2.06-2.06 2.06.93 2.06 2.06-.92 2.06-2.06 2.06zM20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28z"/></svg> },
                { label: 'Instagram', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
                { label: 'Facebook', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
              ].map(({ label, icon }) => (
                <a
                  key={label}
                  href="#"
                  className="inline-flex items-center gap-2.5 px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm font-semibold text-[#1A1A1A] no-underline transition-colors hover:bg-stone-50 hover:border-kelen-green-600"
                >
                  {icon}
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white border border-stone-100 rounded-xl p-6 sm:p-8 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
            <div className="w-11 h-11 rounded-xl bg-[#E8FBF0] text-[#25D366] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </div>
            <h3 className="font-headline font-bold text-[20px] text-[#1A1A1A] tracking-[-0.01em]">
              Notifications WhatsApp
            </h3>
            <p className="text-[15px] text-stone-500 leading-[1.6] flex-1">
              Recevez les nouveautés et promotions de {proName} directement sur WhatsApp.
            </p>
            {waNumber ? (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-b from-[#2EDB70] to-[#25D366] hover:from-[#25D366] hover:to-[#1DBF5A] text-white text-sm font-semibold rounded-lg transition-all duration-200 no-underline shadow-[0_2px_8px_rgba(37,211,102,0.35)] active:scale-[0.97]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                S&apos;abonner sur WhatsApp
              </a>
            ) : (
              <p className="text-xs text-stone-400 italic mt-2">WhatsApp non renseigné</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
