import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pour les professionnels — Kelen",
  description:
    "Créez votre profil vérifié sur Kelen et gagnez la confiance de vos clients.",
};

const PLAN_FEATURES = [
  "Profil public vérifié",
  "Historique des recommandations",
  "Droit de réponse aux signaux",
  "Badge de statut (Or, Argent, Blanc)",
  "Indexation dans les moteurs de recherche",
  "Portfolios photos illimités",
];

const BENEFITS = [
  {
    icon: "✓",
    title: "Profil vérifié gratuit",
    description:
      "Chaque recommandation vérifiée renforce votre crédibilité. Plus vous avez de projets documentés, plus votre statut progresse.",
  },
  {
    icon: "🛡",
    title: "Droit de réponse garanti",
    description:
      "En cas de signal, vous êtes notifié et disposez de 15 jours pour répondre. Votre réponse est publiée sur votre profil.",
  },
  {
    icon: "📊",
    title: "Visibilité internationale",
    description:
      "Les clients consultent Kelen avant de mandater un professionnel. Soyez visible là où ils cherchent.",
  },
  {
    icon: "💰",
    title: "Abonnement simple",
    description:
      "Bénéficiez d'une visibilité illimitée pour 15 € par mois. Pas d'engagement, résiliez à tout moment.",
  },
];

const STATUS_TIERS = [
  {
    name: "White",
    condition: "Profil créé, aucune recommandation vérifiée",
    color: "bg-white border-border text-foreground",
  },
  {
    name: "Silver",
    condition: "1-2 recommandations vérifiées, note ≥ 3.5",
    color: "bg-gray-100 border-gray-300 text-gray-800",
  },
  {
    name: "Gold",
    condition: "3+ recommandations vérifiées, note ≥ 4.0, 0 signal",
    color: "bg-kelen-yellow-50 border-kelen-yellow-500 text-kelen-yellow-800",
  },
];

export default function PourLesProPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Construisez votre réputation.
          <br />
          <span className="text-kelen-green-600">Documentez votre fiabilité.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Kelen permet aux professionnels de confiance de se démarquer grâce à
          un système de vérification transparent et impartial.
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
          Pourquoi rejoindre Kelen ?
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border border-border bg-white p-6"
            >
              <span className="text-2xl">{benefit.icon}</span>
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
          Le système de statuts
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Votre statut est calculé automatiquement en fonction de vos
          recommandations vérifiées, de votre note moyenne et de vos signaux.
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
          Les statuts Rouge et Noir sont attribués en cas de signaux vérifiés.
          Chaque professionnel dispose d&apos;un droit de réponse.
        </p>
      </section>

      {/* Pricing */}
      <section className="mt-24">
        <h2 className="text-center text-3xl font-bold text-foreground">
          Tarification simple et transparente
        </h2>
        
        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-center max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-xl font-bold text-foreground">Standard</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              L&apos;essentiel pour documenter votre fiabilité.
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">Gratuit</span>
              <span className="text-sm font-semibold text-muted-foreground">/ à vie</span>
            </p>
            <ul className="mt-8 space-y-4">
              {PLAN_FEATURES.slice(0, 4).map((feature) => (
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
              Recommandé
            </div>
            <h3 className="text-xl font-bold text-foreground">Premium</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Maximisez votre visibilité et votre crédibilité.
            </p>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">15 €</span>
              <span className="text-sm font-semibold text-muted-foreground">/ par mois</span>
            </p>
            <ul className="mt-8 space-y-4">
              {PLAN_FEATURES.map((feature) => (
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
            Note : Les tarifs pour les professionnels basés en Afrique de l&apos;Ouest sont de 
            <span className="font-bold text-foreground"> 3 000 FCFA / mois</span>. 
            Payable via Wave, Orange Money ou MTN Mobile Money.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-24 rounded-2xl bg-kelen-green-500 p-12 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Prêt à documenter votre fiabilité ?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-kelen-green-100">
          Rejoignez Kelen et montrez à vos clients que vous êtes un
          professionnel de confiance.
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
