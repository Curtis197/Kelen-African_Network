// components/pro-site/ProSiteContact.tsx
export function ProSiteContact({
  proName,
  phone,
  whatsapp,
  email,
  calendarUrl,
  responseTime,
}: {
  proName: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  calendarUrl: string | null
  responseTime?: string
}) {
  return (
    <section id="contact" className="bg-[#1a1a2e] px-6 py-10 text-white text-center">
      <h2 className="font-extrabold text-base mb-1">Prendre contact</h2>
      <p className="text-xs opacity-45 mb-6">
        {responseTime ?? 'Réponse sous 2h'} · Devis gratuit
      </p>
      <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#E05555] text-white py-3 rounded-[var(--pro-radius,16px)] text-sm font-extrabold hover:opacity-90"
          >
            📅 Prendre rendez-vous
          </a>
        )}
        <div className="flex gap-3 w-full">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] py-2 rounded-[var(--pro-radius,16px)] text-xs font-bold text-center hover:opacity-90"
            >
              WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 bg-[#009639] py-2 rounded-[var(--pro-radius,16px)] text-xs font-bold text-center hover:opacity-90"
            >
              Appeler
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex-1 border border-white/30 py-2 rounded-[var(--pro-radius,16px)] text-xs text-center hover:border-white/60"
            >
              Email
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
