import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crédits & Visibilité — Kelen Pro",
};

const CREDIT_PACKAGES = [
  { views: 1000, price: 5, label: "1 000 vues" },
  { views: 5000, price: 22, label: "5 000 vues", savings: "12%" },
  { views: 10000, price: 40, label: "10 000 vues", savings: "20%" },
  { views: 50000, price: 175, label: "50 000 vues", savings: "30%" },
];

// Demo data
const DEMO_CREDITS = {
  remaining: 15000,
  total_purchased: 25000,
  total_used: 10000,
};

const DEMO_HISTORY = [
  {
    id: "1",
    date: "2025-02-01T00:00:00Z",
    type: "purchase" as const,
    amount: 10000,
    price: 40,
  },
  {
    id: "2",
    date: "2025-01-15T00:00:00Z",
    type: "purchase" as const,
    amount: 5000,
    price: 22,
  },
  {
    id: "3",
    date: "2025-01-01T00:00:00Z",
    type: "usage" as const,
    amount: -3200,
    price: null,
  },
];

export default function ProCreditPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        Crédits & Visibilité
      </h1>
      <p className="mt-1 text-muted-foreground">
        Gérez vos crédits de visibilité pour apparaître en priorité dans les
        résultats de recherche.
      </p>

      {/* Current balance */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-kelen-green-500/20 bg-kelen-green-50/30 p-5">
          <p className="text-sm text-muted-foreground">Crédits restants</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {DEMO_CREDITS.remaining.toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-muted-foreground">vues</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Total achetés</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_CREDITS.total_purchased.toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">Total consommés</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {DEMO_CREDITS.total_used.toLocaleString("fr-FR")}
          </p>
        </div>
      </div>

      {/* Buy credits */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          Acheter des crédits
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          5 € / 1 000 vues · Réductions sur les volumes
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.views}
              className="relative rounded-xl border border-border bg-white p-5 text-center transition-colors hover:border-kelen-green-500/30"
            >
              {pkg.savings && (
                <span className="absolute -top-2 right-3 rounded-full bg-kelen-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
                  -{pkg.savings}
                </span>
              )}
              <p className="text-lg font-bold text-foreground">{pkg.label}</p>
              <p className="mt-1 text-2xl font-bold text-kelen-green-600">
                {pkg.price} €
              </p>
              <button className="mt-4 w-full rounded-lg bg-kelen-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600">
                Acheter
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Paiement sécurisé par Stripe. Les crédits n&apos;expirent pas.
        </p>
      </section>

      {/* History */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Historique</h2>
        <div className="mt-4 rounded-xl border border-border bg-white">
          <div className="divide-y divide-border">
            {DEMO_HISTORY.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.type === "purchase"
                      ? `Achat de ${item.amount.toLocaleString("fr-FR")} crédits`
                      : `Consommation de ${Math.abs(item.amount).toLocaleString("fr-FR")} crédits`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {item.price && (
                  <span className="text-sm font-medium text-foreground">
                    {item.price} €
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
