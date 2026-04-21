// components/pro-site/ProSiteNewsletter.tsx — fallback if SubscribeWidget is unavailable
'use client'
import { useState } from 'react'

export function ProSiteNewsletter({
  professionalId,
  proName,
}: {
  professionalId: string
  proName: string
}) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // placeholder — wire to newsletter service in Task 10
    setSubmitted(true)
  }

  return (
    <section className="bg-[#f0faf4] border-y border-[#d4eedd] px-6 py-8 text-center">
      <h2 className="font-extrabold text-sm text-[#1a1a2e] mb-1">Restez informé</h2>
      <p className="text-xs text-gray-500 mb-4">
        Recevez les offres et actualités de {proName} directement dans votre boîte mail.
      </p>
      {submitted ? (
        <p className="text-sm text-[#009639] font-semibold">Merci pour votre inscription !</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="flex-1 border border-[#d4eedd] rounded-full px-4 py-2 text-sm outline-none focus:border-[#009639]"
          />
          <button
            type="submit"
            className="bg-[#009639] text-white px-4 py-2 rounded-full text-sm font-bold hover:opacity-90"
          >
            S&apos;abonner
          </button>
        </form>
      )}
      <p className="text-xs text-gray-400 mt-2">Pas de spam · Désabonnement en 1 clic</p>
    </section>
  )
}
