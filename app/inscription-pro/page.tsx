import Link from "next/link";

export default function ProfessionalSignUpPage() {
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

      <main className="flex-1 flex items-center justify-center py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl" style={{color: 'var(--primary-green)'}}>
              Créez votre profil Kelen
            </h1>
            <p className="mt-4 text-gray-500">
              Rejoignez la liste des professionnels de confiance.
            </p>
          </div>

          <div className="mx-auto max-w-sm mt-8">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="fullName">
                  Nom complet ou nom de l'entreprise
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                />
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="category">
                  Catégorie principale
                </label>
                <select id="category" required className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm">
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="construction">Construction</option>
                    <option value="renovation">Rénovation</option>
                    <option value="plomberie">Plomberie</option>
                    <option value="electricite">Électricité</option>
                    <option value="autre">Autre</option>
                 </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium text-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"
                 style={{ backgroundColor: 'var(--primary-yellow)', color: 'var(--foreground)' }}
              >
                Créer mon compte
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
                Vous avez déjà un compte?{' '} 
              <Link className="font-medium text-green-600 hover:underline" href="/connexion-pro">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t bg-white">
        <p className="text-gray-500">© 2024 Kelen. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
