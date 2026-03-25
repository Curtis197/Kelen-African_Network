import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Tarifs — Kelen",
  description: "Découvrez nos offres de visibilité pour les professionnels et les services de vérification pour les clients.",
};

const PLAN_FEATURES = [
  "Profil public vérifié",
  "Historique des recommandations",
  "Droit de réponse aux signaux",
  "Badge de statut (Or, Argent, Blanc)",
  "Indexation dans les moteurs de recherche",
  "Portfolios photos illimités",
];

export default function TarifsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-base font-semibold uppercase tracking-wider text-kelen-green-600">
          Tarification
        </h2>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          La visibilité s&apos;achète. 
          <br />
          <span className="text-kelen-green-600">La réputation se construit.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Kelen est gratuit pour tous les clients et pour la vérification de base des professionnels. 
          Nous proposons une offre Premium pour les professionnels souhaitant booster leur visibilité.
        </p>
      </div>

      <div className="mt-20 grid gap-8 lg:grid-cols-2 lg:items-center">
        {/* Free Plan */}
        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
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
            className="mt-8 block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted"
          >
            Commencer gratuitement
          </Link>
        </div>

        {/* Premium Plan */}
        <div className="relative rounded-3xl border-2 border-kelen-green-500 bg-white p-8 shadow-xl shadow-kelen-green-100">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-kelen-green-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
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

      <div className="mt-24 text-center">
        <p className="text-sm text-muted-foreground">
          Note : Les tarifs pour les professionnels basés en Afrique de l&apos;Ouest sont de 
          <span className="font-bold text-foreground"> 3 000 FCFA / mois</span>. 
          Payable via Wave, Orange Money ou MTN Mobile Money.
        </p>
      </div>
    </div>
  );
}
