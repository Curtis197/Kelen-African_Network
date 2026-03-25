import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Comment ça marche — Kelen",
  description: "Découvrez le système de vérification de Kelen et comment nous garantissons la fiabilité des professionnels.",
};

const STEPS = [
  {
    icon: <Search className="h-6 w-6 text-kelen-green-600" />,
    title: "1. Recherche",
    description: "Recherchez un professionnel par son nom, son entreprise ou son domaine d'expertise.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-kelen-green-600" />,
    title: "2. Vérification",
    description: "Consultez l'historique documenté : contrats, photos avant/après et délais respectés.",
  },
  {
    icon: <FileText className="h-6 w-6 text-kelen-green-600" />,
    title: "3. Documentation",
    description: "Les clients (soumetteurs) déposent des preuves tangibles de leurs collaborations passées.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-kelen-green-600" />,
    title: "4. Décision",
    description: "Prenez votre décision en toute connaissance de cause, sur la base de faits et non de promesses.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Comment fonctionne <span className="text-kelen-green-600">Kelen</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Kelen n&apos;est pas un annuaire classique. C&apos;est un registre permanent de confiance
          basé sur la documentation systématique des projets réalisés.
        </p>
      </div>

      <div className="mt-20">
        <div className="grid gap-12 sm:grid-cols-2">
          {STEPS.map((step) => (
            <div key={step.title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kelen-green-50">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-24 rounded-2xl bg-muted p-8 sm:p-12">
        <h2 className="text-2xl font-bold text-foreground">Une impartialité totale</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Notre équipe de vérification examine chaque recommandation et chaque signal. 
          Nous demandons des preuves matérielles (contrats signés, photos de chantier, 
          preuves de paiement) pour garantir que chaque information publiée est authentique.
        </p>
        <div className="mt-8">
          <Link
            href="/a-propos"
            className="text-sm font-semibold text-kelen-green-600 hover:text-kelen-green-700"
          >
            En savoir plus sur notre charte de vérification →
          </Link>
        </div>
      </div>

      <div className="mt-24 text-center">
        <h2 className="text-2xl font-bold text-foreground">Prêt à commencer ?</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/recherche"
            className="rounded-lg bg-kelen-green-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            Vérifier un professionnel
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
