import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recommandations — Kelen Pro",
};

// Demo data
const DEMO_RECOMMENDATIONS = [
  {
    id: "rec-1",
    submitter_name: "Fatou D.",
    project_type: "Construction résidentielle",
    location: "Cocody, Abidjan",
    completion_date: "2024-12-15",
    status: "verified" as const,
    linked: true,
  },
  {
    id: "rec-2",
    submitter_name: "Amadou S.",
    project_type: "Rénovation",
    location: "Plateau, Abidjan",
    completion_date: "2024-08-20",
    status: "verified" as const,
    linked: true,
  },
  {
    id: "rec-3",
    submitter_name: "Marie K.",
    project_type: "Extension",
    location: "Yopougon, Abidjan",
    completion_date: "2025-01-10",
    status: "pending" as const,
    linked: false,
  },
];

const STATUS_MAP = {
  pending: { label: "En attente", className: "bg-kelen-yellow-50 text-kelen-yellow-700" },
  verified: { label: "Vérifié", className: "bg-kelen-green-50 text-kelen-green-700" },
  rejected: { label: "Rejeté", className: "bg-kelen-red-50 text-kelen-red-700" },
};

export default function ProRecommendationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Recommandations</h1>
      <p className="mt-1 text-muted-foreground">
        Gérez les recommandations liées à votre profil.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-white">
        <div className="divide-y divide-border">
          {DEMO_RECOMMENDATIONS.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {rec.project_type} — {rec.location}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Par {rec.submitter_name} · Terminé le{" "}
                  {new Date(rec.completion_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_MAP[rec.status].className
                  }`}
                >
                  {STATUS_MAP[rec.status].label}
                </span>
                {!rec.linked && rec.status === "pending" && (
                  <button className="rounded-lg bg-kelen-green-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-kelen-green-600">
                    Lier à mon profil
                  </button>
                )}
                {rec.linked && (
                  <span className="text-xs text-kelen-green-600">Lié ✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
