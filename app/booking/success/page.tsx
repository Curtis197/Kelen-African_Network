import Link from "next/link"
import { CheckCircle } from "lucide-react"

interface Props {
  searchParams: Promise<{ payment_id?: string }>
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { payment_id } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 py-16">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-kelen-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-kelen-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold font-headline text-stone-900">
            Paiement confirmé
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Votre paiement a bien été reçu. Le professionnel a été notifié et vous
            contactera prochainement pour confirmer les détails.
          </p>
          {payment_id && (
            <p className="text-xs text-stone-400 font-mono">
              Réf : {payment_id}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-kelen-green-600 text-white rounded-xl font-semibold text-sm hover:bg-kelen-green-700 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
