import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 py-16">
        <div className="text-7xl font-headline font-black text-stone-200">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold font-headline text-stone-900">
            Page introuvable
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Cette page n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-kelen-green-600 text-white rounded-xl text-sm font-semibold hover:bg-kelen-green-700 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/pros"
            className="px-5 py-2.5 border border-stone-200 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-100 transition-colors"
          >
            Voir les pros
          </Link>
        </div>
      </div>
    </div>
  );
}
