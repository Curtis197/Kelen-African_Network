import Link from "next/link"
import { XCircle } from "lucide-react"

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 py-16">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-stone-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold font-headline text-stone-900">
            Paiement annulé
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Votre paiement n&apos;a pas été effectué. Aucun montant n&apos;a été débité.
            Vous pouvez réessayer ou contacter directement le professionnel.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 border border-stone-200 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-100 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
