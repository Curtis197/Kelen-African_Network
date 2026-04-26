import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Contact — Kelen pour les professionnels",
  description:
    "Contactez l'équipe Kelen pour toute question sur votre profil, votre abonnement ou un problème technique.",
};

const CHANNELS = [
  {
    situation: "Inscription et création de profil",
    desc: "Questions avant de commencer, aide à la configuration initiale.",
    email: "support@kelen.com",
    delay: "Réponse sous 24h",
  },
  {
    situation: "Abonnement et facturation",
    desc: "Activation, annulation, problème de paiement, facture.",
    email: "abonnement@kelen.com",
    delay: "Réponse sous 24h",
  },
  {
    situation: "Problème sur votre profil ou vos réalisations",
    desc: "Contenu non affiché, erreur, bug, photo non chargée.",
    email: "support@kelen.com",
    delay: "Réponse sous 48h",
  },
  {
    situation: "Recommandation en cours de vérification",
    desc: "Une recommandation que vous attendez n'apparaît pas.",
    email: "recommandations@kelen.com",
    delay: "Réponse sous 48h",
  },
  {
    situation: "Partenariats et presse",
    desc: "Organisations professionnelles, médias, chambres de commerce.",
    email: "partenariats@kelen.com",
    delay: "Réponse sous 5 jours ouvrés",
  },
  {
    situation: "Suppression de compte et données",
    desc: "Demande de suppression de compte ou d'export de données (RGPD).",
    email: "donnees@kelen.com",
    delay: "Réponse sous 72h",
  },
];

export default function ProContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Trouvez le bon canal selon votre situation. Pas de formulaire — un email direct à la bonne adresse.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {CHANNELS.map((channel) => (
          <div key={channel.situation} className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">{channel.situation}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{channel.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <a
                href={`mailto:${channel.email}`}
                className="text-sm font-medium text-kelen-green-600 hover:underline"
              >
                {channel.email}
              </a>
              <span className="text-xs text-muted-foreground">{channel.delay}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        Avant d&apos;écrire, consultez la{" "}
        <Link
          href="/pour-les-professionnels/faq"
          className="text-kelen-green-600 hover:underline"
        >
          FAQ
        </Link>{" "}
        — la plupart des questions y ont une réponse immédiate.
      </div>
    </div>
  );
}
