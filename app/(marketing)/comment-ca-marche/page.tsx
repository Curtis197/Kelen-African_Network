import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Comment ça marche — Kelen",
  description:
    "Comment trouver un professionnel de confiance sur Kelen, consulter ses réalisations et collaborer sur votre projet.",
};

const SECTIONS = [
  {
    title: "Chercher un professionnel",
    content:
      "Utilisez la barre de recherche sur la page d'accueil pour filtrer par métier et par zone géographique. Les résultats affichent les professionnels disponibles dans la zone cherchée — avec ou sans abonnement. Les professionnels abonnés ont des profils plus complets, avec plus de projets et une indexation Google.",
  },
  {
    title: "Lire un profil",
    content:
      "Chaque profil professionnel affiche ses réalisations réelles (photos, descriptions, localisations), ses services, ses coordonnées et son badge de statut. Un client qui consulte un profil avant d'appeler arrive avec une idée claire de ce que le professionnel fait et de la qualité de son travail.",
  },
  {
    title: "Comprendre le statut",
    content:
      "Le statut est calculé automatiquement à partir des recommandations vérifiées reçues par le professionnel. Or 🟡 : 3+ recommandations vérifiées, note ≥ 4,5/5, 90%+ positifs. Argent ⚪ : 1–2 recommandations vérifiées, note ≥ 4,0/5, 80%+ positifs. Non classé : aucune recommandation vérifiée encore. Le statut ne s'achète pas. L'abonnement n'a aucun effet sur lui.",
  },
  {
    title: "Créer un projet",
    content:
      "Une fois inscrit, vous pouvez créer un projet et y associer un ou plusieurs professionnels. Le projet regroupe les informations importantes : description, budget, localisation, dates. Vous pouvez inviter un professionnel à vous soumettre une proposition directement depuis Kelen.",
  },
  {
    title: "Collaborer avec un professionnel",
    content:
      "Si le professionnel est abonné, vous pouvez accéder à un espace de collaboration partagé : rapports de chantier quotidiens avec photos et localisation, suivi des étapes, documents partagés (contrats, plans). Vous pouvez approuver ou contester chaque rapport.",
  },
  {
    title: "Soumettre une recommandation",
    content:
      "Après un projet réussi, recommandez le professionnel depuis son profil public. Votre recommandation est soumise à vérification avant d'être publiée et de contribuer à son statut. Une recommandation vérifiée est un signal fort pour les futurs clients.",
  },
  {
    title: "Ce que Kelen fait — et ne fait pas",
    content:
      "Kelen affiche le travail réel des professionnels et publie les recommandations vérifiées de leurs clients. Kelen n'est pas un intermédiaire : il ne prend pas de commission sur les missions, ne gère pas les paiements entre vous et le professionnel, et ne joue pas le rôle d'arbitre en cas de litige. Trouvez le professionnel de confiance — c'est là que s'arrête notre rôle.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Comment ça marche
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Trouvez le professionnel de confiance. Consultez ses réalisations. Collaborez sereinement.
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

      <div className="mt-12 text-center">
        <Link
          href="/recherche"
          className="rounded-lg bg-kelen-green-500 px-8 py-3 text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors"
        >
          Rechercher un professionnel →
        </Link>
      </div>
    </div>
  );
}
