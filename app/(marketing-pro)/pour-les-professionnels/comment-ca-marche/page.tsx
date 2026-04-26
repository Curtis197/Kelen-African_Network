import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Comment ça marche — Kelen pour les professionnels",
  description:
    "Comment Kelen fonctionne pour les professionnels : profil, site web, PDF, Google My Business, recommandations et collaboration client.",
};

const SECTIONS = [
  {
    title: "Le profil — votre source unique",
    content:
      "Tout part de votre profil Kelen. Vous remplissez vos informations une fois — nom, métier, ville, description, photos de réalisations, services. À partir de là, Kelen génère votre site web, votre PDF portfolio et votre fiche Google My Business. Pas de duplication. Pas de mise à jour multiple. Une seule source.",
  },
  {
    title: "Le site web",
    content:
      "Dès votre inscription, vous disposez d'un site web accessible par lien et visible dans les résultats de recherche Kelen. Avec l'abonnement : votre site est indexé sur Google, mis à jour dynamiquement à chaque chargement, et entièrement personnalisable (couleurs, style, sections). Sans abonnement : rendu statique, non indexé Google, 3 projets maximum.",
  },
  {
    title: "Le portfolio PDF",
    content:
      "Exportable depuis votre tableau de bord en un clic. Le PDF contient vos réalisations, vos services, vos coordonnées et votre QR code. Envoyable sur WhatsApp, par email, ou imprimable pour un rendez-vous client. Disponible sur le plan gratuit.",
  },
  {
    title: "La fiche Google My Business",
    content:
      "Avec l'abonnement, Kelen synchronise votre profil avec Google My Business — votre présence dans les recherches locales Google. Vos photos de réalisations, votre description et vos coordonnées sont synchronisées automatiquement.",
  },
  {
    title: "Le copywriting par l'IA",
    content:
      "Lors de la création de votre profil, Kelen vous pose quelques questions sur votre métier et votre clientèle. À partir de vos réponses, l'IA génère votre accroche (titre du site) et votre texte À propos. Vous pouvez les modifier à tout moment.",
  },
  {
    title: "Les recommandations et le statut",
    content:
      "Vos clients peuvent vous recommander directement depuis votre profil public. Chaque recommandation vérifiée contribue à votre statut : Non classé → Argent (1–2 recommandations vérifiées, note ≥ 4,0/5, 80%+ positifs) → Or (3+ recommandations vérifiées, note ≥ 4,5/5, 90%+ positifs). Le statut est affiché sur votre profil. Il ne s'achète pas et n'est pas lié à l'abonnement.",
  },
  {
    title: "La collaboration client",
    content:
      "Avec l'abonnement, vous pouvez inviter vos clients à rejoindre un projet partagé. Ils voient l'avancement, les rapports de chantier, les documents. Vous pouvez recevoir leur approbation ou leurs retours directement dans Kelen.",
  },
];

export default function ProCommentCaMarchePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Comment ça marche
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tout ce que vous devez savoir avant de créer votre profil.
        </p>
      </div>

      <div className="mt-16 space-y-4">
        {SECTIONS.map((section, i) => (
          <section key={section.title} className="rounded-xl border border-border bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kelen-green-50 text-xs font-bold text-kelen-green-700">
                {i + 1}
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {section.content}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Link
          href="/pro/inscription"
          className="rounded-lg bg-kelen-green-500 px-6 py-3 text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors"
        >
          Créer mon profil gratuitement →
        </Link>
        <Link
          href="/pour-les-professionnels/tarifs"
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Voir les tarifs →
        </Link>
      </div>
    </div>
  );
}
