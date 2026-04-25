import Link from "next/link";

export const revalidate = 3600;

export default function CGUPage() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      <header className="mb-20 max-w-3xl ml-auto md:ml-64 lg:ml-72">
        <h1 className="text-stone-900 text-4xl font-extrabold tracking-tight leading-tight mb-4 text-display-md">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-stone-500 font-body text-lg font-manrope">
          Dernière mise à jour : Mars 2024
        </p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-16">
        <aside className="hidden md:block w-64 lg:w-72">
          <nav className="bg-stone-100 rounded-xl h-fit sticky top-24 flex flex-col gap-2 p-4 font-manrope text-sm font-semibold">
            <div className="mb-4 px-3">
              <span className="text-lg font-bold text-stone-900">Kelen</span>
              <p className="text-xs text-stone-500 font-normal">Terms of Service</p>
            </div>
            <Link className="text-kelen-green-700 bg-white shadow-sm rounded-lg py-2 px-3 flex items-center gap-3 transition-all translate-x-1" href="#introduction">
              Introduction
            </Link>
            <Link className="text-stone-500 py-2 px-3 flex items-center gap-3 hover:bg-stone-200 rounded-lg transition-all" href="#conduct">
              Utilisation du service
            </Link>
            <Link className="text-stone-500 py-2 px-3 flex items-center gap-3 hover:bg-stone-200 rounded-lg transition-all" href="#privacy">
              Propriété Intellectuelle
            </Link>
            <Link className="text-stone-500 py-2 px-3 flex items-center gap-3 hover:bg-stone-200 rounded-lg transition-all" href="#liability">
              Responsabilité
            </Link>
            <Link className="text-stone-500 py-2 px-3 flex items-center gap-3 hover:bg-stone-200 rounded-lg transition-all" href="#termination">
              Modification des termes
            </Link>
          </nav>
        </aside>

        <article className="max-w-3xl flex-1 space-y-16">
          <section className="scroll-mt-24" id="introduction">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-kelen-green-100 flex items-center justify-center text-kelen-green-700">1</span>
              Introduction
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4 font-body">
              <p>
                Bienvenue sur <strong>Kelen</strong>. Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent votre accès et votre utilisation de notre plateforme de documentation de la fiabilité professionnelle.
              </p>
              <p>
                En accédant à nos services, vous acceptez sans réserve d&apos;être lié par les présentes conditions. Nous vous recommandons de les lire attentivement car elles définissent vos droits et obligations légales. Si vous n&apos;acceptez pas ces termes, veuillez cesser immédiatement toute utilisation de la plateforme.
              </p>
              <div className="p-6 bg-stone-50 rounded-xl border-l-4 border-kelen-green-500">
                <p className="text-stone-900 font-semibold mb-2">Note Importante</p>
                L&apos;utilisation du service implique la collecte de certaines données personnelles, traitées conformément à notre Politique de Confidentialité.
              </div>
            </div>
          </section>

          <section className="scroll-mt-24" id="conduct">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-kelen-green-100 flex items-center justify-center text-kelen-green-700">2</span>
              Utilisation du service
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4 font-body">
              <p>
                Le service est accessible à tout utilisateur disposant d&apos;un compte valide. Vous vous engagez à fournir des informations exactes et à jour lors de votre inscription.
              </p>
              <h3 className="text-lg font-bold text-stone-900 mt-8 mb-4">Engagements de l&apos;utilisateur :</h3>
              <ul className="space-y-3">
                <li className="flex gap-4">
                  <span className="text-kelen-green-600 mt-0.5 font-bold">✓</span>
                  <span>Maintenir la confidentialité de vos identifiants de connexion.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-kelen-green-600 mt-0.5 font-bold">✓</span>
                  <span>Utiliser la plateforme uniquement à des fins licites et professionnelles.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-kelen-green-600 mt-0.5 font-bold">✓</span>
                  <span>Ne pas tenter de nuire à l&apos;intégrité technique de nos systèmes.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="scroll-mt-24" id="privacy">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-kelen-green-100 flex items-center justify-center text-kelen-green-700">3</span>
              Propriété Intellectuelle
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4 font-body">
              <p>
                L&apos;ensemble des éléments constituant la plateforme (logos, codes, designs, textes, bases de données) est la propriété exclusive de <strong>Kelen</strong> ou de ses partenaires.
              </p>
              <p>
                Toute reproduction, représentation, modification ou adaptation de tout ou partie du service sans notre accord écrit préalable est strictement interdite et peut donner lieu à des poursuites judiciaires.
              </p>
            </div>
          </section>

          <section className="scroll-mt-24" id="liability">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-kelen-green-100 flex items-center justify-center text-kelen-green-700">4</span>
              Responsabilité
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4 font-body">
              <p>
                Nous nous efforçons de maintenir la plateforme disponible 24h/24 et 7j/7. Toutefois, nous ne saurions être tenus responsables des interruptions de service pour maintenance ou des défaillances du réseau internet.
              </p>
              <p>
                Kelen agit en tant qu&apos;outil de facilitation. En aucun cas nous ne pouvons être tenus responsables des décisions commerciales ou stratégiques prises par l&apos;utilisateur via nos outils.
              </p>
            </div>
          </section>

          <section className="scroll-mt-24" id="termination">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-kelen-green-100 flex items-center justify-center text-kelen-green-700">5</span>
              Modification des termes
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed space-y-4 font-body">
              <p>
                Kelen se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par e-mail ou via une notification sur la plateforme.
              </p>
              <p>
                Le fait de continuer à utiliser le service après la publication des modifications constitue votre acceptation des nouvelles conditions.
              </p>
            </div>
          </section>

          <div className="bg-stone-50 p-8 rounded-2xl flex flex-col items-center text-center">
            <h4 className="text-stone-900 font-bold mb-2">Des questions sur nos conditions ?</h4>
            <p className="text-stone-600 text-sm mb-6">Notre équipe juridique est à votre disposition pour toute clarification.</p>
            <Link href="/contact" className="bg-kelen-green-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-kelen-green-600 transition-all shadow-sm">
              Contacter le Support
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
