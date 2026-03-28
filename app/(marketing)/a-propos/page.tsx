import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function AboutPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-kelen-green-50 opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-kelen-yellow-50 opacity-60 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Un annuaire de professionnels{" "}
              <span className="text-kelen-green-500">
                que vous pouvez consulter en confiance.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Kelen documente ce que les professionnels ont réellement livré.
              Trouvez le bon professionnel pour votre projet.{" "}
              <span className="font-medium text-kelen-yellow-700">
                Comparez leur travail. Décidez sur des faits.
              </span>
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/recherche"
                className="inline-flex items-center justify-center rounded-lg bg-kelen-green-500 px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-kelen-green-600"
              >
                Trouver un professionnel
              </Link>
              <Link
                href="/comment-ca-marche"
                className="inline-flex items-center justify-center rounded-lg border-2 border-kelen-green-500 px-8 py-4 text-base font-semibold text-kelen-green-500 transition-colors hover:bg-kelen-green-50"
              >
                Comment ça marche
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT THE PLATFORM ENABLES ===== */}
      <section className="bg-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Ce que Kelen vous permet de faire
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Que votre projet soit à côté ou à l&apos;autre bout du monde.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kelen-green-50 text-xl font-bold text-kelen-green-500">
                1
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Trouver le bon professionnel
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Parcourez notre annuaire par spécialité et localisation. Chaque
                profil affiche ce qui a été réellement livré.
              </p>
            </div>

            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kelen-yellow-50 text-xl font-bold text-kelen-yellow-700">
                2
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Comparer sur des critères objectifs
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Qualité du travail, respect des délais, budget tenu — comparez
                plusieurs professionnels avant de décider.
              </p>
            </div>

            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kelen-green-50 text-xl font-bold text-kelen-green-500">
                3
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Impliquer votre entourage
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Partagez les profils, discutez les choix, construisez votre
                projet avec les personnes de confiance autour de vous.
              </p>
            </div>

            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kelen-yellow-50 text-xl font-bold text-kelen-yellow-700">
                4
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Construire avec certitude
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Avec un professionnel dont le passé est documenté, vous savez
                à qui vous faites confiance avant de payer.
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
            <span className="font-medium text-kelen-red-600">
              Il ne peut être ni acheté, ni modifié.
            </span>
          </p>

          <div className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {/* Gold */}
            <div className="rounded-xl border border-kelen-yellow-500/30 bg-kelen-yellow-50/50 p-6">
              <StatusBadge
                status="gold"
                recommendationCount={7}
                avgRating={4.8}
                size="md"
              />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                3 projets vérifiés ou plus, aucun signal. L&apos;historique le
                plus solide sur Kelen.
              </p>
            </div>

            {/* Silver */}
            <div className="rounded-xl border border-stone-300 bg-stone-50/50 p-6">
              <StatusBadge
                status="silver"
                recommendationCount={2}
                avgRating={4.2}
                size="md"
              />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                1 à 2 projets vérifiés, aucun signal. Historique en
                construction. Professionnel sérieux.
              </p>
            </div>

            {/* White */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/30 p-6">
              <StatusBadge status="white" size="md" />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Aucun historique vérifié sur Kelen. Ni recommandation, ni
                signal. Procédez avec les précautions habituelles.
              </p>
            </div>

            {/* Red */}
            <div className="rounded-xl border border-kelen-red-500/30 bg-kelen-red-50/50 p-6">
              <StatusBadge status="red" signalCount={1} size="md" />
              <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                Un manquement contractuel vérifié et documenté avec preuves.{" "}
                <span className="font-medium text-kelen-red-600">
                  Permanent. Ne peut être ni retiré, ni effacé.
                </span>
              </p>
            </div>

            {/* Black */}
            <div className="rounded-xl border border-stone-800 bg-[#1A1A1A] p-6">
              <StatusBadge status="black" signalCount={3} size="md" />
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Banni de la plateforme. N&apos;apparaît pas dans l&apos;annuaire —
                consultable par nom exact uniquement.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Pour comprendre les critères exacts de chaque statut,{" "}
            <Link href="/comment-ca-marche" className="font-medium text-kelen-green-600 hover:underline">
              consultez comment fonctionne la vérification →
            </Link>
          </p>
        </div>
      </section>

      {/* ===== TWO LAYERS ===== */}
      <section className="bg-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Gratuit pour les clients. Toujours.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            La confiance ne se promet pas. Elle se documente.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Validation */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-kelen-green-50 px-4 py-1.5 text-sm font-semibold text-kelen-green-700">
                Gratuit
              </div>
              <h3 className="mt-4 text-2xl font-bold text-foreground">
                Vérification
              </h3>
              <p className="mt-2 text-muted-foreground">
                Cherchez n&apos;importe quel professionnel par nom. Son historique
                vérifié est accessible à tous, pour toujours.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Recherche par nom — toujours gratuite",
                  "Recommandations vérifiées avec preuves",
                  "Signaux documentés et permanents",
                  "Historique permanent — aucune donnée supprimée à la demande",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-kelen-green-500">✓</span>
                    <span className="text-foreground/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visibility */}
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-kelen-yellow-50 px-4 py-1.5 text-sm font-semibold text-kelen-yellow-700">
                Pour les professionnels
              </div>
              <h3 className="mt-4 text-2xl font-bold text-foreground">
                Visibilité
              </h3>
              <p className="mt-2 text-muted-foreground">
                Les professionnels s&apos;abonnent pour être découverts dans les
                recherches par catégorie.{" "}
                <span className="font-semibold text-kelen-yellow-700">
                  3 000 FCFA / 15 € par mois.
                </span>
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Abonnement mensuel — visibilité illimitée",
                  "Profil visible dans la découverte par catégorie",
                  "N'affecte jamais le statut ou les signaux",
                  "Pages indexables sur Google (SEO)",
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
            Vous êtes un professionnel ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Votre travail parle pour vous — encore faut-il qu&apos;on puisse le voir.
            Kelen vous donne la visibilité que votre travail mérite.
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

      {/* ===== ORIGIN + FOUNDING PHRASE ===== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl">
            « La confiance ne se promet pas.
            <br />
            <span className="text-kelen-green-500">Elle se documente.</span> »
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Kelen est né d&apos;un constat simple : des personnes investissent des
            sommes importantes dans des projets qu&apos;elles ne peuvent pas
            superviser directement, sans aucun moyen fiable d&apos;évaluer les
            professionnels à qui elles font confiance.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Ce problème n&apos;est pas propre à une géographie ou à une identité.
            Il touche quiconque doit payer pour un travail qu&apos;il ne peut pas
            contrôler lui-même. Kelen y répond — pour tout le monde.
          </p>
          <p className="mt-6 text-xs text-muted-foreground/60">
            Kelen signifie « un » en bambara et dioula.
            Un contrat.{" "}
            <span className="font-medium text-kelen-red-600">Un manquement suffit.</span>
          </p>
        </div>
      </section>
    </>
  );
}
