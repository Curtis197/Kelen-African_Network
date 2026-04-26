import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Kelen pour les professionnels — Montrez votre travail. Construisez la confiance.",
  description:
    "Créez votre site web professionnel, votre portfolio PDF et votre fiche Google My Business en quelques minutes. Sans designer, sans agence.",
  openGraph: {
    title: "Kelen pour les professionnels",
    description:
      "Montrez votre travail. Construisez la confiance. Développez votre activité.",
    url: "https://kelen.com/pour-les-professionnels",
  },
};

const FEATURES_FREE = [
  "Profil public et site web",
  "Jusqu'à 3 projets affichés",
  "Export PDF portfolio",
  "Visible dans les résultats de recherche Kelen",
  "Badge de statut (Or, Argent, Non classé)",
];

const FEATURES_PAID = [
  "Indexation Google (SEO)",
  "Site web dynamique — toujours à jour",
  "Projets et photos illimités",
  "Synchronisation Google My Business",
  "Statistiques avancées",
  "Module de collaboration client",
  "Sans engagement — annulation à tout moment",
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

const OBJECTIONS = [
  {
    q: "J'ai déjà un profil Instagram.",
    a: "Instagram demande de produire du contenu en continu — des reels, des stories, de l'engagement. C'est une posture de créateur de contenu, pas de professionnel. Kelen ne demande pas de produire du contenu. Il demande de documenter votre travail : ajouter des photos d'une réalisation terminée, une description, une date. Votre profil existe pour afficher votre travail — pas pour générer de l'engagement.",
  },
  {
    q: "Je n'ai pas le temps de gérer ça.",
    a: "Kelen ne se gère pas. Vous créez votre profil une fois, vous ajoutez vos projets au fil du temps. Il n'y a pas de fréquence à tenir, pas d'algorithme à satisfaire. Chaque projet ajouté reste visible indéfiniment.",
  },
  {
    q: "Je trouve déjà des clients par le bouche-à-oreille.",
    a: "Le bouche-à-oreille fonctionne dans votre cercle immédiat. Kelen vous permet d'être trouvé par des personnes qui ne vous connaissent pas — et qui cherchent quelqu'un avec votre profil précis. Les deux ne s'excluent pas.",
  },
  {
    q: "Est-ce que le statut Or m'aide à apparaître en premier ?",
    a: "Le statut est une information affichée sur votre profil. Il n'influence pas directement votre position dans les résultats. Un profil Non classé actif depuis plusieurs années peut apparaître avant un profil Or récent. La pertinence, la localisation et le contenu documenté comptent davantage.",
  },
];

export default function PourLesProfessionnelsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">

      {/* ── HERO ── */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Montrez votre travail.
          <br />
          <span className="text-kelen-green-600">Construisez la confiance.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Vous avez des années de travail derrière vous. Kelen vous donne l&apos;endroit pour le montrer.
          Un site web, un PDF portfolio, une fiche Google — tous générés depuis un seul profil.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/pro/inscription"
            className="rounded-lg bg-kelen-green-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-kelen-green-600"
          >
            Créer mon profil gratuitement
          </Link>
          <Link
            href="/pour-les-professionnels/comment-ca-marche"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Comment ça marche
          </Link>
        </div>
      </div>

      {/* ── REASSURANCE BAND ── */}
      <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
        {[
          "Gratuit pour commencer",
          "Sans carte bancaire",
          "Profil en ligne en 10 minutes",
          "PDF portfolio inclus",
          "Visible sur Kelen dès le premier jour",
        ].map((item) => (
          <span key={item} className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-kelen-green-500" />
            {item}
          </span>
        ))}
      </div>

      {/* ── PROBLEM ── */}
      <section className="mt-24 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-base font-semibold text-foreground">
            Vous avez des années de travail derrière vous.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Il n&apos;existe aucun endroit pour le montrer. Pas vraiment. Les photos sont sur votre téléphone.
            Les clients vous connaissent — mais les nouveaux ne peuvent pas vous trouver.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-base font-semibold text-foreground">
            Quand un nouveau client vous contacte, vous devez vous vendre.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Expliquer ce que vous faites, envoyer des photos sur WhatsApp, donner des références.
            Un profil Kelen remplace tout ça — le client arrive déjà informé.
          </p>
        </div>
      </section>

      {/* ── 3 OUTPUTS ── */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Trois sorties depuis un seul profil
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Vous remplissez votre profil une fois. Kelen génère tout.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Site web professionnel",
              desc: "Partageable par lien. Indexé sur Google avec l'abonnement. Toujours à jour.",
            },
            {
              title: "PDF portfolio",
              desc: "Exportable en un clic. Envoyable sur WhatsApp. Imprimable pour un rendez-vous.",
            },
            {
              title: "Fiche Google My Business",
              desc: "Votre présence locale synchronisée avec votre profil. Avec l'abonnement.",
            },
          ].map((output) => (
            <div key={output.title} className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold text-foreground">{output.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{output.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">Comment ça marche</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Créez votre profil",
              desc: "Nom, métier, ville, téléphone. Ajoutez vos premières photos de réalisations. L'IA génère votre texte de présentation.",
            },
            {
              step: "2",
              title: "Documentez votre travail",
              desc: "Ajoutez vos projets terminés : photos, description, localisation. Chaque projet renforce votre profil.",
            },
            {
              step: "3",
              title: "Activez Google",
              desc: "Avec l'abonnement, votre profil est indexé sur Google. Vos nouveaux clients vous trouvent directement dans les recherches.",
            },
          ].map((step) => (
            <div key={step.step} className="rounded-xl border border-border bg-white p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-kelen-green-50 text-sm font-bold text-kelen-green-700">
                {step.step}
              </span>
              <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATUS ── */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">Un statut qui se construit</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Calculé automatiquement à partir de vos recommandations vérifiées.
          Il ne s&apos;achète pas. L&apos;abonnement n&apos;a aucun effet sur lui.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STATUS_TIERS.map((tier) => (
            <div key={tier.name} className={`rounded-xl border p-6 ${tier.color}`}>
              <h3 className="text-lg font-bold">{tier.name}</h3>
              <p className="mt-2 text-sm opacity-80">{tier.condition}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="mt-24">
        <h2 className="text-center text-3xl font-bold text-foreground">
          Gratuit pour commencer. Payant pour aller plus loin.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Présent sur Kelen dès le premier jour. Sur Google avec l&apos;abonnement.
        </p>

        <div className="mx-auto mt-16 max-w-4xl grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Free */}
          <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-foreground">Gratuit</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre profil en ligne, visible dans les résultats Kelen dès le premier jour.
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-foreground">
              0{" "}
              <span className="text-sm font-semibold text-muted-foreground">/ à vie</span>
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 flex-shrink-0 text-kelen-green-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pro/inscription"
              className="mt-8 block w-full rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-stone-600 hover:bg-muted transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Paid */}
          <div className="relative rounded-3xl border-2 border-kelen-green-500 bg-white p-8 shadow-xl shadow-kelen-green-100">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-kelen-green-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Abonnement
            </div>
            <h3 className="text-xl font-bold text-foreground">Kelen Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Indexé sur Google. Site dynamique. Fonctionnalités avancées débloquées.
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-foreground">
              15 €{" "}
              <span className="text-sm font-semibold text-muted-foreground">/ mois</span>
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES_PAID.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 flex-shrink-0 text-kelen-green-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pro/inscription"
              className="mt-8 block w-full rounded-xl bg-kelen-green-500 px-4 py-3 text-center text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors"
            >
              Activer l&apos;abonnement
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Professionnels en Afrique de l&apos;Ouest :{" "}
          <span className="font-bold text-foreground">3 000 FCFA / mois</span>{" "}
          via Wave, Orange Money ou MTN Mobile Money.
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ce que l&apos;abonnement ne change jamais : votre statut, votre visibilité sur Kelen.{" "}
          <Link
            href="/pour-les-professionnels/tarifs"
            className="text-kelen-green-600 hover:underline"
          >
            Voir la comparaison complète →
          </Link>
        </p>
      </section>

      {/* ── OBJECTIONS ── */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-foreground">Questions fréquentes</h2>
        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
          {OBJECTIONS.map((obj) => (
            <div key={obj.q} className="px-6 py-5">
              <p className="font-semibold text-foreground text-sm">{obj.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{obj.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/pour-les-professionnels/faq"
            className="text-kelen-green-600 hover:underline"
          >
            Voir toutes les questions →
          </Link>
        </p>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mt-24 rounded-2xl bg-kelen-green-500 p-8 sm:p-12 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Votre travail mérite d&apos;être vu.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-kelen-green-100">
          Créez votre profil. Documentez vos réalisations. Activez Google quand vous êtes prêt.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/pro/inscription"
            className="rounded-lg bg-white px-8 py-3 text-sm font-bold text-kelen-green-700 hover:bg-kelen-green-50 transition-colors"
          >
            Créer mon profil gratuitement
          </Link>
          <Link
            href="/pour-les-professionnels/comment-ca-marche"
            className="rounded-lg border border-white/30 px-8 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Comment ça marche
          </Link>
        </div>
      </section>
    </div>
  );
}
