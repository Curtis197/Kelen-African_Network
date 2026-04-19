// components/portfolio/DomainManager.tsx
"use client";

import { useState } from "react";
import { Globe, RefreshCw, Trash2, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { disconnectDomain } from "@/lib/actions/domain";
import { DomainSearch } from "./DomainSearch";

interface Props {
  domain: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: "Actif",
    color: "bg-kelen-green-100 text-kelen-green-700 border-kelen-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  pending_dns: {
    label: "DNS en propagation",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  failed: {
    label: "Échec — vérifiez le DNS",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

export function DomainManager({ domain, status }: Props) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-surface-container text-on-surface-variant border-outline-variant/30",
    icon: <Globe className="w-3.5 h-3.5" />,
  };

  async function handleDisconnect() {
    setDisconnecting(true);
    setError(null);
    try {
      await disconnectDomain();
      setDisconnected(true);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la déconnexion.");
    } finally {
      setDisconnecting(false);
      setConfirmDisconnect(false);
    }
  }

  if (disconnected) {
    return <DomainSearch />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low">
        <div className="flex items-center gap-3 min-w-0">
          <Globe className="w-5 h-5 text-kelen-green-600 shrink-0" />
          <div className="min-w-0">
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sm text-on-surface hover:text-kelen-green-600 hover:underline block truncate"
            >
              {domain}
            </a>
            <span
              className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.color}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
        </div>

        <button
          onClick={() => setConfirmDisconnect(true)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-on-surface-variant/50 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          title="Déconnecter ce domaine"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {status === "pending_dns" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Propagation DNS en cours
          </p>
          <p>
            Pointez votre DNS vers <code className="bg-amber-100 px-1 rounded">76.76.21.21</code> (A record)
            ou ajoutez un CNAME <code className="bg-amber-100 px-1 rounded">cname.vercel-dns.com</code>.
          </p>
          <p className="text-amber-600">La propagation peut prendre jusqu&apos;à 48h.</p>
        </div>
      )}

      {confirmDisconnect && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-red-800">
            Déconnecter <span className="font-mono">{domain}</span> ?
          </p>
          <p className="text-xs text-red-600">
            Votre site ne sera plus accessible via ce domaine. Vous pourrez en choisir un autre.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              {disconnecting && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirmer
            </button>
            <button
              onClick={() => setConfirmDisconnect(false)}
              className="h-9 px-4 rounded-lg border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
