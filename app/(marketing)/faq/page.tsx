import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, type FaqCategory } from "@/components/ui/FaqAccordion";

export const revalidate = false;

export const metadata: Metadata = {
  title: "FAQ — Kelen",
  description:
    "Toutes les réponses aux questions fréquentes sur la recherche de professionnels et la gestion de projets sur Kelen.",
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    category: "Trouver un professionnel",
    items: [
      {
        q: "Comment chercher un professionnel sur Kelen ?",
        a: "Utilisez la barre de recherche sur la page d'accueil. Filtrez par métier et par zone géographique. Les résultats affichent les professionnels disponibles dans la zone, triés par nombre de recommandations.",
      },
      {
        q: "Est-ce que tous les professionnels sont visibles dans les résultats ?",
        a: "Oui. Les professionnels sont visibles dans les résultats Kelen quel que soit leur plan. Les professionnels abonnés ont des profils plus complets — plus de projets affichés, indexation Google, site dynamique.",
      },
      {
        q: "Que signifie le statut Or ou Argent ?",
        a: "Le statut est calculé automatiquement à partir des recommandations vérifiées. Or : 3+ recommandations vérifiées, note ≥ 4,5/5, 90%+ positifs. Argent : 1–2 recommandations vérifiées, note ≥ 4,0/5, 80%+ positifs. Il ne s'achète pas.",
      },
      {
        q: "Est-ce que Kelen prend une commission sur les missions ?",
        a: "Non. Kelen ne joue pas le rôle d'intermédiaire. Il n'y a pas de commission sur les missions, pas de gestion de paiements entre vous et le professionnel.",
      },
    ],
  },
  {
    category: "Comprendre les profils et le statut",
    items: [
      {
        q: "Que contient un profil professionnel Kelen ?",
        a: "Un profil affiche les réalisations réelles du professionnel (photos, descriptions, localisations), ses services, ses coordonnées et son badge de statut. Les profils abonnés peuvent afficher des projets illimités et un site personnalisé.",
      },
      {
        q: "Un professionnel Non classé est-il fiable ?",
        a: "Non classé signifie qu'aucune recommandation vérifiée n'a encore été publiée — pas que le professionnel est peu fiable. Un professionnel peut être excellent mais nouveau sur Kelen. Consultez ses réalisations et demandez des références.",
      },
      {
        q: "Est-ce que le statut peut être acheté ou amélioré avec un abonnement ?",
        a: "Non. Le statut dépend uniquement des recommandations vérifiées reçues. L'abonnement n'a aucun effet sur lui.",
      },
    ],
  },
  {
    category: "Projets et collaboration",
    items: [
      {
        q: "Comment créer un projet sur Kelen ?",
        a: "Depuis votre tableau de bord client, cliquez sur « Nouveau projet ». Renseignez le titre, la description, le budget estimé et la localisation. Vous pouvez ensuite inviter des professionnels à soumettre une proposition.",
      },
      {
        q: "Comment fonctionne la collaboration avec un professionnel ?",
        a: "Si le professionnel est abonné, vous accédez à un espace partagé : rapports de chantier quotidiens, suivi des étapes, documents. Vous pouvez approuver ou contester chaque rapport directement dans Kelen.",
      },
      {
        q: "Kelen gère-t-il les paiements entre moi et le professionnel ?",
        a: "Non. Kelen ne gère pas les paiements liés aux missions. Les transactions financières sont directement entre vous et le professionnel, selon vos conditions convenues.",
      },
    ],
  },
  {
    category: "Recommandations",
    items: [
      {
        q: "Comment recommander un professionnel ?",
        a: "Depuis son profil public, cliquez sur « Recommander ce professionnel ». Remplissez le formulaire. La recommandation est soumise à vérification avant publication.",
      },
      {
        q: "Qu'est-ce que la vérification d'une recommandation ?",
        a: "L'équipe Kelen vérifie que la recommandation provient d'un vrai client avec un projet réel. Les recommandations non vérifiées ne comptent pas dans le calcul du statut.",
      },
      {
        q: "Puis-je recommander un professionnel qui n'est pas encore sur Kelen ?",
        a: "Oui. Kelen permet de recommander un professionnel non inscrit. La recommandation lui est transmise avec une invitation à rejoindre la plateforme.",
      },
    ],
  },
  {
    category: "Compte et données",
    items: [
      {
        q: "Comment créer un compte client ?",
        a: "Via le bouton « Connexion » → « Créer un compte ». Vous pouvez vous inscrire par email ou avec votre compte Google.",
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Envoyez une demande à donnees@kelen.com. La suppression est effectuée sous 72h.",
      },
      {
        q: "Comment accéder à mes données personnelles ?",
        a: "Envoyez une demande à donnees@kelen.com. Vous recevez une copie de vos données sous 72h (droit d'accès RGPD).",
      },
    ],
  },
];

export default function ClientFaqPage() {
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
            Tout ce que vous devez savoir pour trouver et collaborer avec un professionnel sur Kelen.
          </p>
        </div>

        <div className="mt-12">
          <FaqAccordion categories={FAQ_CATEGORIES} />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Vous ne trouvez pas votre réponse ?{" "}
            <Link href="/contact" className="font-medium text-kelen-green-600 hover:underline">
              Contactez-nous →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
