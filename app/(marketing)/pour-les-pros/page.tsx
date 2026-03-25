import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pour les professionnels — Kelen",
  description:
    "Créez votre profil vérifié sur Kelen et gagnez la confiance de vos clients.",
};

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
            href="/inscription"
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
        <h2 className="text-center text-2xl font-bold text-foreground">
          Tarification simple et transparente
        </h2>
        <div className="mx-auto mt-10 max-w-md">
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Validation
            </p>
            <p className="mt-2 text-4xl font-bold text-foreground">Gratuit</p>
            <p className="mt-1 text-sm text-muted-foreground">Pour toujours</p>
            <ul className="mt-6 space-y-3 text-left text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-kelen-green-500">✓</span> Profil public vérifié
              </li>
              <li className="flex items-center gap-2">
                <span className="text-kelen-green-500">✓</span> Recommandations & avis
              </li>
              <li className="flex items-center gap-2">
                <span className="text-kelen-green-500">✓</span> Droit de réponse aux signaux
              </li>
              <li className="flex items-center gap-2">
                <span className="text-kelen-green-500">✓</span> Tableau de bord analytique
              </li>
            </ul>
            <hr className="my-6 border-border" />
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Visibilité Premium
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              15 € <span className="text-base font-normal text-muted-foreground">/ mois</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Accès illimité · Visibilité maximale
            </p>
          </div>
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
          href="/inscription"
          className="mt-8 inline-flex rounded-lg bg-white px-8 py-3 text-sm font-medium text-kelen-green-700 transition-colors hover:bg-kelen-green-50"
        >
          Créer mon profil gratuitement
        </Link>
      </section>
    </div>
  );
}
