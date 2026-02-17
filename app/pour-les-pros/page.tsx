import Link from "next/link";

export default function ForProsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
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

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none" style={{color: 'var(--primary-green)'}}>
                    Accédez à la clientèle diaspora. Prouvez que vous le méritez.
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl">
                    Kelen connecte les professionnels africains sérieux avec des clients diaspora qui cherchent exactement ce que vous offrez.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
                    href="/inscription-pro"
                     style={{ backgroundColor: 'var(--primary-yellow)', color: 'var(--foreground)' }}
                  >
                    Créer mon profil professionnel
                  </Link>
                </div>
              </div>
               <div className="w-full h-64 bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm">Le marché</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Une opportunité sans équivalent</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  €47 milliards envoyés en Afrique en 2023. Des millions de projets. Un seul problème : la confiance.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">La Liste Or ne s'achète pas.</h3>
                      <p className="text-gray-500">
                        Votre statut se construit projet par projet, vérifié par vos clients.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Payez pour la visibilité, pas pour le statut.</h3>
                      <p className="text-gray-500">
                       €5 pour 1,000 vues de profil. Pas d'abonnement, pas de commission.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Un standard élevé.</h3>
                      <p className="text-gray-500">
                        Un manquement vérifié = Liste Rouge permanente. C'est la garantie de votre sérieux.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
               <div className="w-full h-64 bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </section>

      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t bg-white">
        <p className="text-gray-500">© 2024 Kelen. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
