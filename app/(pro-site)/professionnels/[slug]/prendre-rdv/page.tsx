import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Calendar, MessageCircle, Mail } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PrendreRdvPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, owner_name, email, whatsapp, phone, category, city")
    .eq("slug", slug)
    .single()

  if (!pro) notFound()

  const proName = pro.business_name ?? pro.owner_name ?? "ce professionnel"
  const contactWhatsApp = pro.whatsapp ?? pro.phone
  const whatsappUrl = contactWhatsApp
    ? `https://wa.me/${contactWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, je souhaite prendre rendez-vous avec ${proName}.`)}`
    : null

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12">
      <div className="max-w-lg mx-auto space-y-8">
        <Link
          href={`/professionnels/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </Link>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-kelen-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-kelen-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-headline text-stone-900">
                Prendre rendez-vous
              </h1>
              <p className="text-sm text-stone-500">{proName}</p>
            </div>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed">
            Contactez directement {proName} pour convenir d&apos;un rendez-vous.
          </p>

          <div className="space-y-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 w-full p-4 bg-kelen-green-50 border border-kelen-green-200 rounded-2xl hover:bg-kelen-green-100 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-kelen-green-600 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-kelen-green-800">Contacter via WhatsApp</p>
                  <p className="text-xs text-kelen-green-600">Réponse rapide</p>
                </div>
              </a>
            )}
            {pro.email && (
              <a
                href={`mailto:${pro.email}?subject=${encodeURIComponent(`Demande de rendez-vous — ${proName}`)}`}
                className="flex items-center gap-4 w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-stone-100 transition-colors"
              >
                <Mail className="w-5 h-5 text-stone-500 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-stone-700">Envoyer un email</p>
                  <p className="text-xs text-stone-500">{pro.email}</p>
                </div>
              </a>
            )}
            {!whatsappUrl && !pro.email && (
              <p className="text-sm text-stone-500 text-center py-4">
                Aucune information de contact disponible.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
