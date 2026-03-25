import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-white">
        {/* Subtle decorative accent */}
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-kelen-green-50 opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-kelen-yellow-50 opacity-60 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Vous construisez en Afrique depuis la diaspora.{" "}
              <span className="text-kelen-green-500">
                Vérifiez les professionnels avant de virer.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Kelen documente les professionnels africains. Contrats, photos,
              délais —{" "}
              <span className="font-medium text-kelen-yellow-700">
                chaque projet laisse une trace permanente et vérifiée.
              </span>{" "}
              Cherchez un nom. Consultez l&apos;historique. Décidez.
            </p>

            {/* Two equal CTAs */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/recherche"
                className="inline-flex items-center justify-center rounded-lg bg-kelen-green-500 px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-kelen-green-600"
              >
                Vérifier un professionnel
              </Link>
              <Link
                href="/recherche?mode=browse"
                className="inline-flex items-center justify-center rounded-lg border-2 border-kelen-green-500 px-8 py-4 text-base font-semibold text-kelen-green-500 transition-colors hover:bg-kelen-green-50"
              >
                Trouver un professionnel
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Un système simple. Des faits vérifiés.{" "}
            <span className="font-medium text-kelen-yellow-700">Une confiance documentée.</span>
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kelen-green-50 text-xl font-bold text-kelen-green-500">
                1
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Un client soumet un dossier
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Contrat signé, photos du projet, dates respectées ou non.
                Chaque dossier est accompagné de preuves.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kelen-yellow-50 text-xl font-bold text-kelen-yellow-700">
                2
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Kelen vérifie les preuves
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Notre équipe examine contrats, photos et chronologie.{" "}
                <span className="font-medium text-kelen-yellow-700">Rien n&apos;est publié sans vérification.</span>
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kelen-green-50 text-xl font-bold text-kelen-green-500">
                3
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Vous consultez l&apos;historique documenté
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Cherchez n&apos;importe quel professionnel par nom. Son
                historique vérifié apparaît. Vous décidez.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATUS TIERS ===== */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Un statut qui se mérite
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Le statut d&apos;un professionnel reflète son historique documenté.{" "}
            <span className="font-medium text-kelen-red-600">Il ne peut être ni acheté, ni modifié.</span>
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Gold */}
            <div className="rounded-xl border border-kelen-yellow-500/30 bg-kelen-yellow-50/50 p-6">
              <StatusBadge
                status="gold"
                recommendationCount={7}
                avgRating={4.8}
                size="md"
              />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Au moins 5 projets vérifiés, aucun signal, satisfaction
                exemplaire. L&apos;identité professionnelle la plus documentée
                sur Kelen. Référence pour tout mandant diaspora.
              </p>
            </div>

            {/* Silver */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6">
              <StatusBadge
                status="silver"
                recommendationCount={3}
                avgRating={4.2}
                size="md"
              />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Premiers projets vérifiés, historique en construction.
                Professionnel sérieux, pas encore au niveau Or.
              </p>
            </div>

            {/* White */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/30 p-6">
              <StatusBadge status="white" size="md" />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Aucun historique sur Kelen. Ni recommandation, ni signal.
                Procédez avec les précautions habituelles.
              </p>
            </div>

            {/* Red */}
            <div className="rounded-xl border border-kelen-red-500/30 bg-kelen-red-50/50 p-6">
              <StatusBadge
                status="red"
                signalCount={1}
                size="md"
              />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Un manquement contractuel vérifié et documenté avec preuves.{" "}
                <span className="font-medium text-kelen-red-600">Ce signal ne peut être ni retiré, ni effacé.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TWO SYSTEMS ===== */}
      <section className="bg-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Deux systèmes indépendants
          </h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Validation */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-kelen-green-50 px-4 py-1.5 text-sm font-semibold text-kelen-green-700">
                Gratuit
              </div>
              <h3 className="mt-4 text-2xl font-bold text-foreground">
                Validation
              </h3>
              <p className="mt-2 text-muted-foreground">
                Recherchez n&apos;importe quel professionnel par nom exact.
                Voyez son historique vérifié, ses recommandations, ses signaux.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Recherche par nom — toujours gratuite",
                  "Recommandations vérifiées avec preuves",
                  "Signaux documentés et permanents",
                  "Ne peut être payé pour retirer un signal",
                  "Historique permanent — aucune donnée ne peut être supprimée à la demande",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-kelen-green-500">✓</span>
                    <span className="text-foreground/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advertisement */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-kelen-yellow-50 px-4 py-1.5 text-sm font-semibold text-kelen-yellow-700">
                CPM
              </div>
              <h3 className="mt-4 text-2xl font-bold text-foreground">
                Visibilité
              </h3>
              <p className="mt-2 text-muted-foreground">
                Les professionnels payent pour être découverts dans les
                recherches par catégorie.{" "}
                <span className="font-semibold text-kelen-yellow-700">5 € pour 1 000 vues de profil.</span>
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Pas d'abonnement — payez par vue",
                  "Profil visible dans la découverte par catégorie",
                  "N'affecte jamais le statut ou les signaux",
                  "Crédit épuisé = retiré de la découverte",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-kelen-yellow-600">→</span>
                    <span className="text-foreground/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRO CTA ===== */}
      <section className="bg-kelen-green-500 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Vous êtes professionnel en Afrique ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Accédez à la clientèle diaspora. Prouvez que vous le méritez.
            La visibilité s&apos;achète. La réputation se construit.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-base text-white/60">
            Inscription gratuite pendant la phase de lancement.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/pour-les-pros"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-kelen-green-500 shadow-sm transition-colors hover:bg-white/90"
            >
              En savoir plus
            </Link>
            <Link
              href="/inscription?role=professional"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Créer mon profil
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOUNDING PHRASE ===== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl">
            « La confiance ne se promet pas.
            <br />
            <span className="text-kelen-green-500">Elle se documente.</span> »
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Kelen signifie « un » en bambara et dioula.
            <br />
            Un contrat. Une parole.{" "}
            <span className="font-medium text-kelen-red-600">Un manquement suffit.</span>
          </p>
        </div>
      </section>
    </>
  );
}
