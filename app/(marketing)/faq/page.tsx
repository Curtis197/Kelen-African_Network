import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "FAQ — Kelen",
  description: "Réponses aux questions les plus fréquentes sur l'utilisation de Kelen.",
};

const FAQS = [
  {
    question: "Comment puis-je vérifier un professionnel ?",
    answer: "Utilisez la barre de recherche sur la page d'accueil ou sur la page de recherche. Tapez le nom de l'entreprise ou du professionnel pour consulter son historique de recommandations vérifiées.",
  },
  {
    question: "Qu'est-ce qu'une recommandation vérifiée ?",
    answer: "Il s'agit d'un témoignage client accompagné de preuves documentaires (contrat, factures, photos) qui a été validé par notre équipe pour garantir l'authenticité de la collaboration.",
  },
  {
    question: "Que se passe-t-il en cas de mauvais travail ?",
    answer: "Un client peut soumettre un 'signal'. Le professionnel dispose alors d'un droit de réponse. Si le signal est documenté et véridique, il reste visible sur le profil du professionnel pour avertir les futurs clients.",
  },
  {
    question: "Combien coûte l'utilisation de Kelen ?",
    answer: "La consultation et la soumission de recommandations ou de signaux sont gratuites pour les clients. Pour les professionnels, l'inscription de base est gratuite, et une offre Premium est disponible.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Questions Fréquentes
      </h1>
      <p className="mt-4 text-center text-muted-foreground">
        Tout ce que vous devez savoir sur le fonctionnement de Kelen.
      </p>

      <div className="mt-12 space-y-8">
        {FAQS.map((faq) => (
          <div key={faq.question} className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground italic">
              « {faq.question} »
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-16 rounded-2xl bg-kelen-green-50 p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Vous n&apos;avez pas trouvé votre réponse ?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Notre équipe est là pour vous aider par email ou via notre formulaire de contact.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <a
            href="mailto:support@kelen.com"
            className="rounded-lg bg-kelen-green-500 px-6 py-2 text-sm font-medium text-white hover:bg-kelen-green-600 shadow-sm transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  );
}
