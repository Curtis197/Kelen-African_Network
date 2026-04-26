import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, type FaqCategory } from "@/components/ui/FaqAccordion";

export const revalidate = false;

export const metadata: Metadata = {
  title: "FAQ — Kelen pour les professionnels",
  description: "Toutes les réponses aux questions fréquentes des professionnels sur Kelen.",
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    category: "Avant de s'inscrire",
    items: [
      {
        q: "Kelen est-il vraiment gratuit ?",
        a: "Oui. Votre profil est gratuit, sans limite de durée. Il inclut votre site web, l'accès aux résultats de recherche Kelen, l'export PDF et jusqu'à 3 projets. L'abonnement ajoute l'indexation Google et les fonctionnalités avancées.",
      },
      {
        q: "Pour quel type de professionnel Kelen est-il fait ?",
        a: "Tout professionnel qui livre un travail physique ou une prestation de service : artisans, prestataires du bâtiment, architectes, designers, photographes, traducteurs, consultants, et plus. Si vous pouvez montrer ce que vous faites, Kelen est fait pour vous.",
      },
      {
        q: "Est-ce que je dois avoir un site web existant ?",
        a: "Non. Kelen crée votre site web à partir de votre profil. Vous n'avez besoin de rien d'autre.",
      },
      {
        q: "Combien de temps faut-il pour créer un profil ?",
        a: "Entre 10 et 20 minutes pour un profil complet avec photos. L'essentiel — nom, métier, ville, téléphone — prend moins de 5 minutes.",
      },
    ],
  },
  {
    category: "Profil et visibilité",
    items: [
      {
        q: "Mon profil est-il visible immédiatement ?",
        a: "Oui. Dès votre inscription, votre profil est accessible par lien et visible dans les résultats de recherche Kelen. L'indexation Google est activée avec l'abonnement.",
      },
      {
        q: "Quelle est la différence entre le rendu statique et dynamique ?",
        a: "Le rendu statique (gratuit) génère votre page une fois et la sert telle quelle. Le rendu dynamique (abonnement) recharge votre profil à chaque visite — vos dernières réalisations sont toujours visibles immédiatement.",
      },
      {
        q: "Puis-je avoir un domaine personnalisé ?",
        a: "Oui, avec l'abonnement. Vous pouvez connecter votre propre nom de domaine (ex: monsiteweb.com) à votre profil Kelen.",
      },
      {
        q: "Est-ce que je peux personnaliser le style de mon site ?",
        a: "Oui, avec l'abonnement. Vous pouvez choisir les couleurs, le style des coins, et les sections affichées. Sans abonnement, le site utilise le style par défaut Kelen.",
      },
      {
        q: "Si j'annule mon abonnement, que devient mon profil ?",
        a: "Votre profil reste en ligne et visible sur Kelen. Vous perdez l'indexation Google et les fonctionnalités avancées. Tout votre contenu est conservé.",
      },
    ],
  },
  {
    category: "Portfolio et contenu",
    items: [
      {
        q: "Combien de projets puis-je ajouter ?",
        a: "3 projets avec le plan gratuit. Illimité avec l'abonnement.",
      },
      {
        q: "Quels types de fichiers puis-je uploader ?",
        a: "Photos (JPG, PNG, WebP) sur tous les plans. Vidéos avec l'abonnement.",
      },
      {
        q: "Comment fonctionne le PDF portfolio ?",
        a: "Depuis votre tableau de bord, vous cliquez sur « Exporter le PDF ». Le PDF est généré instantanément à partir de votre profil. Il contient vos réalisations, vos services, vos coordonnées et un QR code vers votre profil. Disponible sur le plan gratuit.",
      },
      {
        q: "Puis-je choisir quels projets apparaissent sur mon site ?",
        a: "Oui. Vous contrôlez la visibilité de chaque projet depuis votre tableau de bord.",
      },
    ],
  },
  {
    category: "Recommandations et statut",
    items: [
      {
        q: "Comment mes clients me recommandent-ils ?",
        a: "Via le lien de recommandation accessible depuis votre profil public. Vos clients cliquent sur « Recommander ce professionnel », remplissent un formulaire court, et la recommandation est soumise à vérification.",
      },
      {
        q: "Qu'est-ce que la vérification d'une recommandation ?",
        a: "L'équipe Kelen vérifie que la recommandation provient d'un vrai client, avec un projet réel. Les recommandations non vérifiées ne comptent pas dans le calcul du statut.",
      },
      {
        q: "Comment le statut est-il calculé ?",
        a: "Automatiquement par le système. Or : 3+ recommandations vérifiées, note ≥ 4,5/5, 90%+ positifs. Argent : 1–2 recommandations vérifiées, note ≥ 4,0/5, 80%+ positifs. Non classé : aucune recommandation vérifiée.",
      },
      {
        q: "L'abonnement améliore-t-il mon statut ?",
        a: "Non. Le statut dépend uniquement de vos recommandations vérifiées. L'abonnement n'a aucun effet.",
      },
      {
        q: "Le statut influence-t-il ma position dans les résultats ?",
        a: "Le statut est une information affichée sur votre profil. Il n'est pas un facteur de classement direct. La pertinence du profil, la localisation et la richesse du contenu comptent davantage.",
      },
      {
        q: "Puis-je recommander un autre professionnel ?",
        a: "Oui. Même un professionnel qui n'est pas encore inscrit sur Kelen. La recommandation externe lui est transmise, et l'invitation à rejoindre la plateforme lui est envoyée.",
      },
    ],
  },
  {
    category: "Abonnement et paiement",
    items: [
      {
        q: "Comment annuler mon abonnement ?",
        a: "Depuis votre tableau de bord → Abonnement → Gérer mon abonnement. L'annulation est immédiate. Vous conservez l'accès aux fonctionnalités payantes jusqu'à la fin de la période en cours.",
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "En Europe : carte bancaire via Stripe. En Afrique de l'Ouest : Wave, Orange Money, MTN Mobile Money.",
      },
      {
        q: "Y a-t-il un engagement minimum ?",
        a: "Non. Sans engagement. Annulation possible à tout moment.",
      },
      {
        q: "Puis-je passer du plan gratuit à l'abonnement plus tard ?",
        a: "Oui. Depuis votre tableau de bord → Abonnement → Activer l'abonnement. Vos données, projets et recommandations existants sont conservés.",
      },
    ],
  },
  {
    category: "Technique",
    items: [
      {
        q: "Kelen fonctionne-t-il sur mobile ?",
        a: "Oui. L'application est installable sur mobile (PWA). Elle fonctionne hors-ligne pour la saisie des rapports de chantier.",
      },
      {
        q: "Comment fonctionne la synchronisation Google My Business ?",
        a: "Avec l'abonnement, vous connectez votre compte Google My Business depuis votre tableau de bord. Kelen synchronise vos photos de réalisations et votre description automatiquement.",
      },
      {
        q: "Mes données sont-elles sécurisées ?",
        a: "Oui. Vos données sont hébergées sur des serveurs sécurisés. Consultez notre politique de confidentialité pour les détails.",
      },
    ],
  },
];

export default function ProFaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
              cat.items.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              }))
            ),
          }),
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Questions fréquentes
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tout ce que vous devez savoir sur Kelen pour les professionnels.
          </p>
        </div>

        <div className="mt-12">
          <FaqAccordion categories={FAQ_CATEGORIES} />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Vous ne trouvez pas votre réponse ?{" "}
            <Link
              href="/pour-les-professionnels/contact"
              className="font-medium text-kelen-green-600 hover:underline"
            >
              Contactez-nous →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
