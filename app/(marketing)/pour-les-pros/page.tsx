import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { Check, Eye, Users, ShieldCheck, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Pour les professionnels — Kelen",
  description:
    "Votre travail, enfin visible. Rejoignez Kelen et accédez à des clients qui vous font confiance avant de vous appeler.",
};

const PLAN_FEATURES_FREE = [
  "Profil public vérifié",
  "Historique des recommandations",
  "Droit de réponse aux signaux (15 jours)",
  "Badge de statut (Or, Argent)",
  "Recherche par nom — visible pour toujours",
];

const PLAN_FEATURES_PREMIUM = [
  "Tout le plan Standard",
  "Visible dans la découverte par catégorie",
  "Portfolios photos et vidéos illimités",
  "Indexation Google (SEO)",
  "Statistiques avancées de profil",
];

const BENEFITS: { Icon: React.ElementType; title: string; description: string }[] = [
  {
    Icon: Eye,
    title: "Votre travail, enfin visible",
    description:
      "Ce que vous avez livré reste. Projets réalisés, photos, délais respectés — votre historique s'accumule et parle pour vous auprès de chaque client potentiel.",
  },
  {
    Icon: Users,
    title: "Des clients déjà convaincus",
    description:
      "Les clients qui vous trouvent sur Kelen ont consulté votre profil avant de vous contacter. Ils arrivent avec un projet, un budget, et une confiance déjà établie.",
  },
  {
    Icon: ShieldCheck,
    title: "Droit de réponse garanti",
    description:
      "En cas de signal, vous êtes notifié et disposez de 15 jours pour répondre avec vos preuves. Votre réponse est publiée sur votre profil.",
  },
  {
    Icon: Globe,
    title: "Clientèle sans frontières",
    description:
      "Vos clients peuvent être à côté ou à des milliers de kilomètres. Kelen vous connecte avec ceux qui investissent sérieusement — partout.",
  },
];

const STATUS_TIERS = [
  {
    name: "Non classé",
    condition: "Profil créé, aucune recommandation vérifiée encore",
    color: "bg-stone-50 border-stone-200 text-stone-600",
  },
  {
    name: "Argent",
    condition: "1–2 recommandations vérifiées, 0 signal",
    color: "bg-stone-100 border-stone-300 text-stone-700",
  },
  {
    name: "Or",
    condition: "3+ recommandations vérifiées, 0 signal",
    color: "bg-kelen-yellow-50 border-kelen-yellow-500 text-kelen-yellow-800",
  },
];

export default function PourLesProPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Votre travail, enfin visible.
          <br />
          <span className="text-kelen-green-600">
            Des clients qui vous font confiance avant de vous appeler.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Kelen donne à votre travail la visibilité qu&apos;il mérite. Chaque projet
          livré devient une preuve. Chaque preuve construit votre réputation.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/pro/inscription"
            className="rounded-lg bg-kelen-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            Créer mon profil professionnel
          </Link>
          <Link
            href="/comment-ca-marche"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Comment ça marche
          </Link>
        </div>
      </div>

      {/* Benefits */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Ce que Kelen change pour vous
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border border-border bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kelen-green-50">
                <benefit.Icon className="h-5 w-5 text-kelen-green-600" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Status tiers */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Un statut qui se construit
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Votre statut est calculé automatiquement à partir de vos projets
          vérifiés. Il ne peut pas être acheté. Il se mérite.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STATUS_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 ${tier.color}`}
            >
              <h3 className="text-lg font-bold">{tier.name}</h3>
              <p className="mt-2 text-sm opacity-80">{tier.condition}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Un signal vérifié entraîne un statut Rouge — permanent, irrévocable,
          quelle que soit la liste atteinte auparavant.
          Chaque professionnel dispose d&apos;un droit de réponse de 15 jours.{" "}
          <Link href="/comment-ca-marche" className="font-medium text-kelen-green-600 hover:underline">
            Comprendre les critères →
          </Link>
        </p>
      </section>

      {/* Pricing */}
      <section className="mt-24">
        <h2 className="text-center text-3xl font-bold text-foreground">
          Tarification simple
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Documenter votre fiabilité est gratuit. Être découvert par de nouveaux clients est payant.
        </p>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-center max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-xl font-bold text-foreground">Standard</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre profil vérifié, accessible à quiconque cherche votre nom.
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">Gratuit</span>
              <span className="text-sm font-semibold text-muted-foreground">/ à vie</span>
            </p>
            <ul className="mt-8 space-y-4">
              {PLAN_FEATURES_FREE.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-kelen-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/pro/inscription"
              className="mt-8 block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-stone-600 hover:bg-muted"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="relative rounded-3xl border-2 border-kelen-green-500 bg-white p-8 shadow-xl shadow-kelen-green-100 transition-all hover:-translate-y-1">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-kelen-green-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              Découverte active
            </div>
            <h3 className="text-xl font-bold text-foreground">Premium</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Soyez découvert par des clients qui cherchent votre spécialité maintenant.
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">15 €</span>
              <span className="text-sm font-semibold text-muted-foreground">/ par mois</span>
            </p>
            <ul className="mt-8 space-y-4">
              {PLAN_FEATURES_PREMIUM.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-kelen-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/pro/inscription"
              className="mt-8 block w-full rounded-xl bg-kelen-green-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-kelen-green-600"
            >
              Passer au Premium
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Professionnels basés en Afrique de l&apos;Ouest :{" "}
            <span className="font-bold text-foreground">3 000 FCFA / mois</span>{" "}
            via Wave, Orange Money ou MTN Mobile Money.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-24 rounded-2xl bg-kelen-green-500 p-6 sm:p-12 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Votre prochain client vous cherche.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-kelen-green-100">
          Rejoignez Kelen. Montrez ce que vous avez livré.
          Laissez votre travail convaincre à votre place.
        </p>
        <Link
          href="/pro/inscription"
          className="mt-8 inline-flex rounded-lg bg-white px-8 py-3 text-sm font-medium text-kelen-green-700 transition-colors hover:bg-kelen-green-50"
        >
          Créer mon profil gratuitement
        </Link>
      </section>
    </div>
  );
}
