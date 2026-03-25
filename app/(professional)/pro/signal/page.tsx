import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signaux — Kelen Pro",
};

// Demo data
const DEMO_SIGNALS = [
  {
    id: "sig-1",
    breach_type: "timeline",
    breach_label: "Non-respect des délais",
    severity: "minor",
    submitter_name: "Anonyme",
    created_at: "2025-02-08T00:00:00Z",
    status: "pending_response" as const,
    response_deadline: "2025-02-23T00:00:00Z",
    pro_response: null,
  },
];

export default function ProSignalsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Signaux</h1>
      <p className="mt-1 text-muted-foreground">
        Consultez et répondez aux signaux déposés sur votre profil.
      </p>

      <div className="mt-4 rounded-lg border border-kelen-yellow-500/30 bg-kelen-yellow-50 p-4 text-sm text-kelen-yellow-800">
        Vous disposez de <strong>15 jours</strong> pour répondre à chaque
        signal. Votre réponse sera publiée sur votre profil public.
      </div>

      <div className="mt-6 space-y-4">
        {DEMO_SIGNALS.map((signal) => {
          const deadline = new Date(signal.response_deadline);
          const now = new Date();
          const daysLeft = Math.max(
            0,
            Math.ceil(
              (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          );

          return (
            <div
              key={signal.id}
              className="rounded-xl border border-kelen-red-500/20 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-kelen-red-500">⚠</span>
                    <h3 className="font-semibold text-foreground">
                      {signal.breach_label}
                    </h3>
                    <span className="rounded-full bg-kelen-red-100 px-2 py-0.5 text-xs font-medium text-kelen-red-700">
                      {signal.severity === "minor"
                        ? "Mineur"
                        : signal.severity === "major"
                          ? "Majeur"
                          : "Critique"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Signalé le{" "}
                    {new Date(signal.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    par {signal.submitter_name}
                  </p>
                </div>
                {signal.status === "pending_response" && (
                  <span className="shrink-0 rounded-full bg-kelen-yellow-50 px-2.5 py-0.5 text-xs font-medium text-kelen-yellow-700">
                    {daysLeft} jours restants
                  </span>
                )}
              </div>

              {/* Response form */}
              {signal.status === "pending_response" && !signal.pro_response && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Votre réponse
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                    placeholder="Rédigez votre réponse de manière factuelle et professionnelle..."
                  />
                  <div className="mt-3 flex justify-end">
                    <button className="rounded-lg bg-kelen-green-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600">
                      Envoyer ma réponse
                    </button>
                  </div>
                </div>
              )}

              {signal.pro_response && (
                <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Votre réponse
                  </p>
                  <p className="text-sm text-foreground/80">
                    {signal.pro_response}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {DEMO_SIGNALS.length === 0 && (
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun signal sur votre profil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
