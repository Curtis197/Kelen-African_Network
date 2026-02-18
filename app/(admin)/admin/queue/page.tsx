import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "File de vérification — Kelen Admin",
};

// Demo data
const DEMO_QUEUE = [
  {
    id: "q-1",
    type: "recommendation" as const,
    professional_name: "Kouadio Construction",
    professional_slug: "kouadio-construction-abidjan",
    submitter_name: "Fatou D.",
    submitter_country: "FR",
    created_at: "2025-02-17T10:30:00Z",
    priority: "normal" as const,
  },
  {
    id: "q-2",
    type: "signal" as const,
    professional_name: "Traoré BTP",
    professional_slug: "traore-btp-dakar",
    submitter_name: "Anonyme",
    submitter_country: "BE",
    created_at: "2025-02-16T14:15:00Z",
    priority: "high" as const,
  },
  {
    id: "q-3",
    type: "recommendation" as const,
    professional_name: "Bamba Électricité",
    professional_slug: "bamba-electricite-dakar",
    submitter_name: "Jean-Pierre M.",
    submitter_country: "CH",
    created_at: "2025-02-15T09:00:00Z",
    priority: "normal" as const,
  },
  {
    id: "q-4",
    type: "signal" as const,
    professional_name: "Diallo Plomberie",
    professional_slug: "diallo-plomberie-abidjan",
    submitter_name: "Anonyme",
    submitter_country: "FR",
    created_at: "2025-02-14T16:45:00Z",
    priority: "high" as const,
  },
  {
    id: "q-5",
    type: "recommendation" as const,
    professional_name: "Kouadio Construction",
    professional_slug: "kouadio-construction-abidjan",
    submitter_name: "Aïssata T.",
    submitter_country: "FR",
    created_at: "2025-02-13T11:20:00Z",
    priority: "normal" as const,
  },
  {
    id: "q-6",
    type: "recommendation" as const,
    professional_name: "Sow Architecture",
    professional_slug: "sow-architecture-abidjan",
    submitter_name: "Paul R.",
    submitter_country: "CA",
    created_at: "2025-02-12T08:00:00Z",
    priority: "normal" as const,
  },
];

export default function AdminQueuePage() {
  const recommendations = DEMO_QUEUE.filter(
    (item) => item.type === "recommendation"
  );
  const signals = DEMO_QUEUE.filter((item) => item.type === "signal");

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        File de vérification
      </h1>
      <p className="mt-1 text-muted-foreground">
        {DEMO_QUEUE.length} éléments en attente de vérification.
      </p>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        <span className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white">
          Tous ({DEMO_QUEUE.length})
        </span>
        <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
          Recommandations ({recommendations.length})
        </span>
        <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
          Signaux ({signals.length})
        </span>
      </div>

      {/* Queue list */}
      <div className="mt-4 rounded-xl border border-border bg-white">
        <div className="divide-y divide-border">
          {DEMO_QUEUE.map((item) => (
            <Link
              key={item.id}
              href={`/admin/queue/${item.id}`}
              className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                {/* Priority indicator */}
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item.priority === "high"
                      ? "bg-kelen-red-500"
                      : "bg-kelen-green-500"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.type === "recommendation"
                          ? "bg-kelen-green-50 text-kelen-green-700"
                          : "bg-kelen-red-50 text-kelen-red-700"
                      }`}
                    >
                      {item.type === "recommendation"
                        ? "Recommandation"
                        : "Signal"}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {item.professional_name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Par {item.submitter_name} ({item.submitter_country}) ·{" "}
                    {new Date(item.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-kelen-yellow-50 px-3 py-1.5 text-xs font-medium text-kelen-yellow-700">
                À vérifier
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
