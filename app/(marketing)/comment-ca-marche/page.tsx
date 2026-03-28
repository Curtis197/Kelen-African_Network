import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShieldCheck, FileText, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Comment ça marche — Kelen",
  description:
    "Comprendre le système de vérification Kelen : critères de recommandation, signaux, statuts professionnels et ce que vérifie concrètement notre équipe.",
};

export default function CommentCaMarchePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Comment fonctionne{" "}
          <span className="text-kelen-green-600">Kelen</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Kelen n&apos;est pas un annuaire d&apos;avis. C&apos;est un registre de preuves.
          Voici exactement ce qui est vérifié, comment, et ce que cela signifie.
        </p>
      </div>

      {/* === HOW CLIENTS USE IT === */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-foreground">Pour les clients</h2>
        <p className="mt-2 text-muted-foreground">
          Deux façons d&apos;utiliser Kelen selon votre situation.
        </p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kelen-green-50">
              <Search className="h-6 w-6 text-kelen-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Vérifier un professionnel que vous connaissez
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Quelqu&apos;un vous a recommandé un professionnel. Avant de vous
                engager, cherchez son nom exact sur Kelen. Son statut, ses
                recommandations vérifiées, et ses signaux éventuels
                apparaissent immédiatement. Gratuit, toujours.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kelen-green-50">
              <ShieldCheck className="h-6 w-6 text-kelen-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Trouver un professionnel que vous ne connaissez pas
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Parcourez l&apos;annuaire par spécialité et localisation. Tous les
                professionnels visibles en découverte ont un abonnement actif.
                Filtrez par statut Or pour n&apos;afficher que ceux avec un
                historique vérifié solide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === WHAT VERIFICATION MEANS === */}
      <section className="mt-20 rounded-2xl bg-muted p-8 sm:p-12">
        <h2 className="text-2xl font-bold text-foreground">
          Ce que « vérifié » signifie concrètement
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Notre équipe examine chaque recommandation et chaque signal avant
          publication. Rien n&apos;est publié sur la base de déclarations seules.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold text-foreground">Pour une recommandation</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Contrat signé entre les deux parties",
                "Photos du projet (avant, pendant, après)",
                "Correspondance confirmant les termes et la livraison",
                "Preuve que le projet correspond au professionnel concerné",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-kelen-green-500">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Pour un signal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Contrat signé précisant les engagements",
                "Preuves du manquement (photos, échanges, dates)",
                "Preuve que le manquement est documentable et non ambigu",
                "Le professionnel est notifié — il dispose de 15 jours pour répondre",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-kelen-red-500">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          En cas de doute sur l&apos;authenticité d&apos;un dossier, Kelen peut demander
          des preuves supplémentaires ou refuser la publication. Un signal
          faussement soumis entraîne la suspension du compte soumetteur.
        </p>
      </section>

      {/* === STATUS TIERS === */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-foreground">
          Les statuts
        </h2>
        <p className="mt-2 text-muted-foreground">
          Calculés automatiquement. Impossibles à acheter.
        </p>

        <div className="mt-8 space-y-4">
          {/* Gold */}
          <div className="rounded-xl border border-kelen-yellow-500/30 bg-kelen-yellow-50/50 p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">🟡</span>
              <h3 className="text-lg font-bold text-kelen-yellow-800">Liste Or</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/70">
              <strong>Critères :</strong> 3 recommandations vérifiées minimum, zéro signal.
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              <strong>Ce que ça signifie :</strong> Ce professionnel a livré au moins trois projets
              conformes à leurs contrats, documentés avec preuves. Aucun manquement n&apos;est enregistré.
              C&apos;est le niveau de fiabilité le plus élevé sur Kelen.
            </p>
          </div>

          {/* Silver */}
          <div className="rounded-xl border border-stone-300 bg-stone-50/50 p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚪</span>
              <h3 className="text-lg font-bold text-stone-700">Liste Argent</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/70">
              <strong>Critères :</strong> 1 à 2 recommandations vérifiées, zéro signal.
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              <strong>Ce que ça signifie :</strong> Ce professionnel a commencé à construire son
              historique. Des projets vérifiés existent. Il n&apos;a pas encore atteint le seuil de
              la Liste Or.
            </p>
          </div>

          {/* White */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/30 p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">🤍</span>
              <h3 className="text-lg font-bold text-stone-600">Non classé</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/70">
              <strong>Critères :</strong> Aucune recommandation vérifiée, aucun signal.
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              <strong>Ce que ça signifie :</strong> Ce professionnel n&apos;a pas encore d&apos;historique
              documenté sur Kelen. L&apos;absence d&apos;historique est en elle-même une information.
              Procédez avec les précautions habituelles.
            </p>
          </div>

          {/* Red */}
          <div className="rounded-xl border border-kelen-red-500/30 bg-kelen-red-50/50 p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔴</span>
              <h3 className="text-lg font-bold text-kelen-red-700">Liste Rouge</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/70">
              <strong>Critères :</strong> Un signal vérifié ou plus, quel que soit le nombre de recommandations.
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              <strong>Ce que ça signifie :</strong> Un manquement contractuel a été documenté avec preuves
              et vérifié par notre équipe. Ce statut est permanent et irrévocable.{" "}
              <span className="font-medium text-kelen-red-600">
                Il ne peut pas être retiré, même avec de nouvelles recommandations.
              </span>
            </p>
            <p className="mt-2 text-sm text-foreground/70">
              Le professionnel conserve son droit de réponse — sa version est publiée
              aux côtés du signal. Cela ne change pas le statut.
            </p>
          </div>

          {/* Black */}
          <div className="rounded-xl border border-stone-800 bg-[#1A1A1A] p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚫</span>
              <h3 className="text-lg font-bold text-white">Liste Noire</h3>
            </div>
            <p className="mt-2 text-sm text-white/60">
              <strong className="text-white/80">Critères :</strong> Manquements multiples documentés ou fraude avérée. Décision de la plateforme.
            </p>
            <p className="mt-1 text-sm text-white/60">
              <strong className="text-white/80">Ce que ça signifie :</strong> Ce professionnel est banni de la plateforme.
              Il n&apos;apparaît pas dans l&apos;annuaire de découverte, mais reste consultable par nom exact.{" "}
              <span className="font-medium text-white/80">
                La transparence s&apos;applique dans les deux sens.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* === RIGHT OF RESPONSE === */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-foreground">
          Le droit de réponse
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Lorsqu&apos;un signal est soumis, le professionnel concerné est notifié
          immédiatement. Il dispose de <strong>15 jours</strong> pour soumettre
          sa version des faits, accompagnée de ses propres preuves.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Sa réponse est publiée sur son profil, aux côtés du signal. Les
          utilisateurs voient les deux côtés. Le droit de réponse ne supprime
          pas le signal — il permet au professionnel d&apos;apporter des éléments de contexte.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Si des preuves irréfutables démontrent que le signal est faux (erreur
          d&apos;identité, document falsifié), Kelen peut retirer le signal après
          investigation. Ce cas est rare et rigoureusement encadré.
        </p>
      </section>

      {/* === FOR PROFESSIONALS === */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-foreground">
          Comment soumettre une recommandation ou un signal
        </h2>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kelen-green-50">
              <FileText className="h-6 w-6 text-kelen-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Recommandation
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Vous avez travaillé avec un professionnel et le projet s&apos;est bien
                passé. Soumettez un dossier : contrat, photos du résultat,
                description du projet. Après vérification, la recommandation
                apparaît sur son profil et contribue à son statut Or.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kelen-red-50">
              <AlertTriangle className="h-6 w-6 text-kelen-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Signal</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Un professionnel n&apos;a pas respecté ses engagements contractuels.
                Soumettez un dossier avec le contrat et les preuves du
                manquement. Le professionnel est notifié. Après vérification,
                le signal est publié de façon permanente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="mt-24 text-center">
        <h2 className="text-2xl font-bold text-foreground">Prêt à commencer ?</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/recherche"
            className="rounded-lg bg-kelen-green-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            Trouver un professionnel
          </Link>
          <Link
            href="/inscription"
            className="rounded-lg border border-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
