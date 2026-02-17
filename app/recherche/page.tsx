import Link from "next/link";

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
       <header className="px-4 lg:px-6 h-14 flex items-center bg-white shadow-md">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-xl font-bold" style={{ color: 'var(--primary-green)' }}>Kelen</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/recherche">
            Vérifier un professionnel
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pour-les-pros">
            Pour les professionnels
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl" style={{color: 'var(--primary-green)'}}>
              Vérifier ou Trouver un Professionnel
            </h1>
            <p className="mt-4 text-gray-500 md:text-xl">
              Deux façons d'utiliser Kelen. Choisissez celle qui correspond à votre besoin.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 pt-12 md:grid-cols-2 md:pt-16">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Je connais le nom</h2>
              <p className="mt-2 text-gray-500">Vérifiez l'historique d'un professionnel spécifique.</p>
              <form className="mt-6 flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Nom exact du professionnel ou de l'entreprise"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary-green)', color: 'white' }}
                >
                  Rechercher
                </button>
              </form>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Je cherche un profil</h2>
              <p className="mt-2 text-gray-500">Parcourez les professionnels par catégorie et localisation.</p>
              <form className="mt-6 flex flex-col gap-4">
                 <select className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none">
                    <option value="">Choisir une catégorie</option>
                    <option value="construction">Construction</option>
                    <option value="renovation">Rénovation</option>
                    <option value="plomberie">Plomberie</option>
                    <option value="electricite">Électricité</option>
                 </select>
                <input
                  type="text"
                  placeholder="Ville ou pays"
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
                   style={{ backgroundColor: 'var(--primary-yellow)', color: 'var(--foreground)' }}
                >
                  Parcourir
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex items-center justify-center w-full h-24 border-t bg-white">
        <p className="text-gray-500">© 2024 Kelen. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
