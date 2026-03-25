import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal d'activité — Kelen Admin",
};

// Demo data
const DEMO_LOGS = [
  {
    id: "1",
    action: "recommendation_approved",
    label: "Recommandation approuvée",
    details: "Fatou D. → Kouadio Construction",
    admin: "admin@kelen.africa",
    created_at: "2025-02-17T11:00:00Z",
  },
  {
    id: "2",
    action: "signal_approved",
    label: "Signal approuvé",
    details: "Anonyme → Traoré BTP",
    admin: "admin@kelen.africa",
    created_at: "2025-02-16T15:30:00Z",
  },
  {
    id: "3",
    action: "recommendation_rejected",
    label: "Recommandation rejetée",
    details: "Paul R. → Sow Architecture (informations insuffisantes)",
    admin: "admin@kelen.africa",
    created_at: "2025-02-15T10:45:00Z",
  },
  {
    id: "4",
    action: "professional_status_changed",
    label: "Statut modifié",
    details: "Traoré BTP : silver → red",
    admin: "system",
    created_at: "2025-02-16T15:31:00Z",
  },
  {
    id: "5",
    action: "user_registered",
    label: "Nouvel utilisateur",
    details: "Marie K. (FR) — Diaspora",
    admin: "system",
    created_at: "2025-02-14T08:20:00Z",
  },
];

const ACTION_STYLES: Record<string, string> = {
  recommendation_approved: "bg-kelen-green-50 text-kelen-green-700",
  recommendation_rejected: "bg-kelen-red-50 text-kelen-red-700",
  signal_approved: "bg-kelen-red-50 text-kelen-red-700",
  professional_status_changed: "bg-kelen-yellow-50 text-kelen-yellow-700",
  user_registered: "bg-muted text-muted-foreground",
};

export default function AdminJournalPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        Journal d&apos;activité
      </h1>
      <p className="mt-1 text-muted-foreground">
        Historique de toutes les actions administratives.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-white">
        <div className="divide-y divide-border">
          {DEMO_LOGS.map((log) => (
            <div key={log.id} className="px-6 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ACTION_STYLES[log.action] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {log.label}
                </span>
                <span className="text-sm text-foreground">{log.details}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {log.admin === "system" ? "Système" : log.admin} ·{" "}
                {new Date(log.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
