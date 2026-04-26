import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { Check, Eye, Users, Globe, TrendingUp } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pour les professionnels — Kelen",
  description:
    "Votre travail, enfin visible. Rejoignez Kelen et accédez à des clients qui vous font confiance avant de vous appeler.",
};

const PLAN_FEATURES_FREE = [
  "Profil public et site web",
  "Jusqu'à 3 projets affichés",
  "Export PDF portfolio",
  "Visible dans les résultats de recherche Kelen",
  "Badge de statut (Or, Argent, Non classé)",
];

const PLAN_FEATURES_PREMIUM = [
  "Indexation Google (SEO)",
  "Site web dynamique — toujours à jour",
  "Projets et photos illimités",
  "Synchronisation Google My Business",
  "Statistiques avancées",
  "Module de collaboration client",
  "Sans engagement — annulation à tout moment",
];

const BENEFITS: { Icon: React.ElementType; title: string; description: string }[] = [
  {
    Icon: Eye,
    title: "Montrez votre travail",
    description:
      "Ce que vous avez livré reste. Projets réalisés, photos, descriptions — votre historique s'accumule et parle pour vous auprès de chaque client potentiel.",
  },
  {
    Icon: Users,
    title: "Des clients déjà convaincus",
    description:
      "Un client qui consulte votre profil avant de vous appeler arrive déjà convaincu. Il a vu votre travail, sait ce que vous faites, et vient avec un projet concret.",
  },
  {
    Icon: Globe,
    title: "Présent partout où sont vos clients",
    description:
      "Partageable par lien, visible sur Kelen, indexé sur Google avec l'abonnement. Votre profil travaille pour vous — en ligne et hors ligne via le PDF exportable.",
  },
  {
    Icon: TrendingUp,
    title: "Une réputation qui se construit",
    description:
      "Chaque recommandation reçue renforce votre statut. Le statut Or ou Argent ne s'achète pas — il se mérite par la qualité du travail livré.",
  },
];

const STATUS_TIERS = [
  {
    name: "Non classé",
    condition: "Profil créé, aucune recommandation vérifiée encore",
    color: "bg-stone-50 border-stone-200 text-stone-600",
  },
  {
    name: "Argent ⚪",
    condition: "1–2 recommandations vérifiées, note ≥ 4,0/5, 80%+ positifs",
    color: "bg-stone-100 border-stone-300 text-stone-700",
  },
  {
    name: "Or 🟡",
    condition: "3+ recommandations vérifiées, note ≥ 4,5/5, 90%+ positifs",
    color: "bg-kelen-yellow-50 border-kelen-yellow-500 text-kelen-yellow-800",
  },
];

export default function PourLesProPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Montrez votre travail.
          <br />
          <span className="text-kelen-green-600">
            Construisez la confiance.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Kelen transforme ce que vous avez livré en présence professionnelle. Projets, photos, recommandations — votre réputation s&apos;accumule et parle pour vous.
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
          Le statut est calculé automatiquement. Il ne s&apos;achète pas. L&apos;abonnement n&apos;a aucun effet sur lui.{" "}
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
          Présent sur Kelen dès le premier jour. Sur Google avec l&apos;abonnement.
        </p>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-center max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-xl font-bold text-foreground">Gratuit</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre profil en ligne, visible dans les résultats Kelen dès le premier jour.
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
              Abonnement
            </div>
            <h3 className="text-xl font-bold text-foreground">Kelen Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Indexé sur Google. Site dynamique. Fonctionnalités avancées débloquées.
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
              Activer l&apos;abonnement
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
          Votre travail mérite d&apos;être vu.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-kelen-green-100">
          Créez votre profil. Documentez vos réalisations. Laissez votre travail convaincre à votre place.
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
