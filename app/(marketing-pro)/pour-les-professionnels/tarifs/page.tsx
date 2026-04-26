import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { FaqAccordion, type FaqCategory } from "@/components/ui/FaqAccordion";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Tarifs — Kelen pour les professionnels",
  description:
    "Présent sur Kelen gratuitement. Indexé sur Google avec l'abonnement à 3 000 FCFA ou 15 € par mois. Sans engagement.",
};

const COMPARISON_ROWS: {
  category: string;
  rows: { label: string; free: boolean | string; paid: boolean | string }[];
}[] = [
  {
    category: "Présence",
    rows: [
      { label: "Profil public et site web", free: true, paid: true },
      { label: "Visible dans les résultats Kelen", free: true, paid: true },
      { label: "Indexation Google (SEO)", free: false, paid: true },
      { label: "Rendu du site", free: "Statique (SSG)", paid: "Dynamique (SSR)" },
    ],
  },
  {
    category: "Contenu",
    rows: [
      { label: "Projets portfolio", free: "3 maximum", paid: "Illimité" },
      { label: "Photos", free: "15 maximum", paid: "Illimité" },
      { label: "Vidéos", free: false, paid: true },
      { label: "Services et produits", free: true, paid: true },
    ],
  },
  {
    category: "Sorties",
    rows: [
      { label: "Export PDF portfolio", free: true, paid: true },
      { label: "Export PDF catalogue", free: true, paid: true },
      { label: "Synchronisation Google My Business", free: false, paid: true },
      { label: "Personnalisation du site (couleurs, style)", free: false, paid: true },
      { label: "Domaine personnalisé", free: false, paid: true },
    ],
  },
  {
    category: "Collaboration et analytics",
    rows: [
      { label: "Module de collaboration client", free: false, paid: true },
      { label: "Journal de chantier", free: true, paid: true },
      { label: "Statistiques de base", free: true, paid: true },
      { label: "Statistiques avancées (6 mois, sources de trafic)", free: false, paid: true },
      { label: "Newsletter clients", free: false, paid: true },
    ],
  },
  {
    category: "Réputation",
    rows: [
      { label: "Recommandations reçues", free: true, paid: true },
      { label: "Badge de statut (Or, Argent, Non classé)", free: true, paid: true },
    ],
  },
];

const TARIFS_FAQ: FaqCategory[] = [
  {
    category: "Questions sur le paiement",
    items: [
      {
        q: "Comment annuler mon abonnement ?",
        a: "Depuis votre tableau de bord → Abonnement → Gérer mon abonnement. L'annulation est immédiate. Vous conservez l'accès aux fonctionnalités payantes jusqu'à la fin de la période en cours.",
      },
      {
        q: "Que se passe-t-il si j'annule ?",
        a: "Votre profil reste en ligne et visible sur Kelen. Vous perdez l'indexation Google, le rendu dynamique et les fonctionnalités avancées. Votre contenu, vos réalisations et vos recommandations sont conservés.",
      },
      {
        q: "Est-ce que le statut Or ou Argent change avec l'abonnement ?",
        a: "Non. Le statut dépend uniquement de vos recommandations vérifiées. L'abonnement n'a aucun effet sur lui.",
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "En Europe : carte bancaire via Stripe. En Afrique de l'Ouest : Wave, Orange Money, MTN Mobile Money (3 000 FCFA / mois).",
      },
      {
        q: "Y a-t-il un engagement minimum ?",
        a: "Non. Vous pouvez annuler à tout moment, sans frais ni préavis.",
      },
      {
        q: "Mon profil est-il visible immédiatement après l'inscription ?",
        a: "Oui. Votre profil est visible dans les résultats de recherche Kelen dès votre inscription, que vous soyez abonné ou non. L'abonnement ajoute l'indexation Google.",
      },
    ],
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-kelen-green-600" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

export default function ProTarifsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Tarifs</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Présent sur Kelen dès le premier jour. Sur Google avec l&apos;abonnement.
        </p>
      </div>

      {/* Price cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">Gratuit</h2>
          <p className="mt-1 text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">à vie</p>
          <Link
            href="/pro/inscription"
            className="mt-4 block rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-muted transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
        <div className="rounded-2xl border-2 border-kelen-green-500 bg-white p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">Kelen Pro</h2>
          <p className="mt-1 text-3xl font-bold">15 €</p>
          <p className="text-sm text-muted-foreground">/ mois — ou 3 000 FCFA</p>
          <Link
            href="/pro/inscription"
            className="mt-4 block rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors"
          >
            Activer l&apos;abonnement
          </Link>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-16">
        <h2 className="mb-6 text-xl font-bold text-foreground">Comparaison complète</h2>
        {COMPARISON_ROWS.map((group) => (
          <div key={group.category} className="mb-8">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {group.category}
            </h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Fonctionnalité
                    </th>
                    <th className="w-28 px-4 py-2.5 text-center font-medium text-muted-foreground">
                      Gratuit
                    </th>
                    <th className="w-28 px-4 py-2.5 text-center font-medium text-kelen-green-700">
                      Kelen Pro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {group.rows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 text-foreground">{row.label}</td>
                      <td className="px-4 py-3 text-center">
                        <CellValue value={row.free} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CellValue value={row.paid} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* What subscription never changes */}
      <div className="mt-4 rounded-xl border border-border bg-white p-6">
        <h2 className="font-semibold text-foreground">Ce que l&apos;abonnement ne change jamais</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>— Votre statut (Or, Argent, Non classé) : uniquement lié à vos recommandations vérifiées</li>
          <li>— Votre visibilité dans les résultats de recherche Kelen</li>
          <li>— Le contenu de votre profil : il reste intact si vous annulez</li>
        </ul>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="mb-8 text-xl font-bold text-foreground">Questions sur les tarifs</h2>
        <FaqAccordion categories={TARIFS_FAQ} />
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/pro/inscription"
          className="rounded-lg bg-kelen-green-500 px-8 py-3 text-sm font-bold text-white hover:bg-kelen-green-600 transition-colors"
        >
          Créer mon profil gratuitement →
        </Link>
      </div>
    </div>
  );
}
