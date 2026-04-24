'use client'
import { useState } from 'react'

export function ProSiteContact({
  proName,
  phone,
  whatsapp,
  email,
  calendarUrl,
}: {
  proName: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  calendarUrl: string | null
  responseTime?: string
}) {
  const [showCalendar, setShowCalendar] = useState(false)

  const waNumber = whatsapp?.replace(/\D/g, '') ?? null

  return (
    <section className="py-[88px] border-t border-stone-100 bg-stone-50" id="contact">
      <div className="max-w-[1160px] mx-auto px-8">
        <div
          className="grid gap-[72px] items-start"
          style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)' }}
        >
          {/* Left — contact info */}
          <div>
            <span className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-stone-500 mb-3">
              <span className="w-4 h-0.5 bg-kelen-green-600 rounded-full" />
              CONTACT
            </span>
            <h2 className="font-headline font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-[#1A1A1A] mt-3 mb-3">
              Parlons de votre projet.
            </h2>
            <p className="text-base text-stone-500 leading-[1.6] mb-6 max-w-[40ch]">
              Contact direct, sans intermédiaire.
            </p>

            {/* Calendar CTA */}
            {calendarUrl ? (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-b from-kelen-green-600 to-kelen-green-700 hover:from-kelen-green-700 hover:to-kelen-green-800 text-white font-semibold text-[15px] rounded-lg transition-all duration-200 no-underline shadow-[0_2px_8px_rgba(0,97,36,0.28)] active:scale-[0.97] mb-6"
              >
                📅 Prendre rendez-vous
              </a>
            ) : (
              <button
                onClick={() => setShowCalendar((v) => !v)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-b from-kelen-green-600 to-kelen-green-700 hover:from-kelen-green-700 hover:to-kelen-green-800 text-white font-semibold text-[15px] rounded-lg transition-all duration-200 shadow-[0_2px_8px_rgba(0,97,36,0.28)] active:scale-[0.97] mb-6"
              >
                📅 Prendre rendez-vous
              </button>
            )}

            {showCalendar && !calendarUrl && (
              <div className="bg-white border border-stone-200 rounded-xl p-8 mb-6">
                <div className="text-center py-10 px-5 bg-stone-50 rounded-lg border-2 border-dashed border-stone-300">
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">
                    Intégration calendrier
                  </p>
                  <p className="text-xs text-stone-500">
                    Connectez Google Calendar dans vos paramètres pour activer la prise de RDV.
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <span className="flex-1 h-px bg-stone-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
                ou contactez directement
              </span>
              <span className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Contact ways */}
            <ul className="list-none p-0 m-0">
              {whatsapp && (
                <li className="flex justify-between items-baseline py-4 border-t border-stone-200 gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">WhatsApp</span>
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-kelen-green-800 font-medium no-underline hover:underline underline-offset-3">
                    {whatsapp}
                  </a>
                </li>
              )}
              {phone && (
                <li className="flex justify-between items-baseline py-4 border-t border-stone-200 gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Téléphone</span>
                  <a href={`tel:${phone}`} className="font-mono text-sm text-kelen-green-800 font-medium no-underline hover:underline underline-offset-3">
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex justify-between items-baseline py-4 border-t border-stone-200 border-b border-stone-200 gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Email</span>
                  <a href={`mailto:${email}`} className="font-mono text-sm text-kelen-green-800 font-medium no-underline hover:underline underline-offset-3">
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Right — message form */}
          <form
            className="bg-white border border-stone-100 rounded-xl p-8 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)]"
            onSubmit={(e) => e.preventDefault()}
          >
            <h3 className="font-headline font-bold text-[18px] text-[#1A1A1A] tracking-[-0.01em] mb-2">
              Envoyez un message
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">Nom complet</span>
                <input
                  placeholder="Votre nom"
                  className="text-[15px] px-3.5 py-3 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-kelen-green-600 focus:ring-2 focus:ring-kelen-green-600/20 transition"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">Téléphone</span>
                <input
                  placeholder="+33 6 00 00 00 00"
                  className="text-[15px] px-3.5 py-3 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-kelen-green-600 focus:ring-2 focus:ring-kelen-green-600/20 transition"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[#1A1A1A]">Email</span>
              <input
                type="email"
                placeholder="vous@exemple.com"
                className="text-[15px] px-3.5 py-3 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-kelen-green-600 focus:ring-2 focus:ring-kelen-green-600/20 transition"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[#1A1A1A]">Nature du projet</span>
              <select
                defaultValue=""
                className="text-[15px] px-3.5 py-3 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-kelen-green-600 focus:ring-2 focus:ring-kelen-green-600/20 transition"
              >
                <option value="" disabled>Sélectionner…</option>
                <option>Construction neuve</option>
                <option>Rénovation</option>
                <option>Suivi de chantier</option>
                <option>Conseil ou étude</option>
                <option>Autre</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[#1A1A1A]">Votre projet en quelques lignes</span>
              <textarea
                rows={4}
                placeholder="Localisation, surface approximative, budget indicatif, échéance…"
                className="text-[15px] px-3.5 py-3 border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-kelen-green-600 focus:ring-2 focus:ring-kelen-green-600/20 transition resize-none"
              />
            </label>

            <button
              type="submit"
              className="w-full mt-2 px-5 py-3.5 bg-gradient-to-b from-kelen-green-600 to-kelen-green-700 hover:from-kelen-green-700 hover:to-kelen-green-800 text-white font-semibold text-[15px] rounded-lg transition-all duration-200 shadow-[0_2px_8px_rgba(0,97,36,0.28)] active:scale-[0.98]"
            >
              Envoyer le message
            </button>
            <p className="text-xs text-stone-400 leading-snug">
              En envoyant, vous acceptez d&apos;être recontacté par {proName}.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
