import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white shadow-md">
        <Link className="flex items-center justify-center" href="#">
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
      <section className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-6">
        <div className="w-full h-64 bg-gray-200 animate-pulse mb-8"></div> {/* Placeholder for hero image */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4" style={{ color: 'var(--primary-green)' }}>
          Vous investissez en Afrique.
          <br />
          Sachez à qui vous pouvez faire confiance.
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-gray-600 mb-8">
          Kelen répertorie les professionnels africains dont les clients ont documenté chaque projet. Cherchez un nom. Voyez son historique. Décidez en connaissance de cause.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
            href="/recherche"
            style={{ backgroundColor: 'var(--primary-yellow)', color: 'var(--foreground)' }}
          >
            Vérifier un professionnel
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
            href="/recherche?mode=browse"
            style={{ borderColor: 'var(--primary-green)', color: 'var(--primary-green)' }}
          >
            Trouver un professionnel
          </Link>
        </div>
      </section>
      <footer className="flex items-center justify-center w-full h-24 border-t bg-white">
        <p className="text-gray-500">© 2024 Kelen. Tous droits réservés.</p>
      </footer>
    </main>
  );
}
