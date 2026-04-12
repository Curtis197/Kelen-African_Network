"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface Props {
  proId: string;
  isConnected: boolean;
  verificationStatus: string | null;
  lastSyncedAt: string | null;
  gbpLocationName: string | null;
}

type GBPStep = "idle" | "creating" | "verifying" | "syncing_photos";

export function GoogleBusinessConnect({
  proId,
  isConnected,
  verificationStatus,
  lastSyncedAt,
  gbpLocationName,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<GBPStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<"PHONE_CALL" | "SMS" | "EMAIL" | "ADDRESS">("SMS");
  const [showVerifOptions, setShowVerifOptions] = useState(false);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const googleParam = searchParams.get("google");
    if (googleParam === "connected") {
      setSuccessMsg("Compte Google connecté. Vous pouvez maintenant créer votre profil Google Maps.");
      router.replace("/pro/dashboard");
    } else if (googleParam === "denied") {
      setError("Connexion annulée.");
      router.replace("/pro/dashboard");
    } else if (googleParam === "error") {
      setError("Erreur lors de la connexion Google. Veuillez réessayer.");
      router.replace("/pro/dashboard");
    }
  }, [searchParams, router]);

  async function handleCreateBusiness() {
    setStep("creating");
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/google/create-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_exists") {
          setError("Un profil Google Business existe déjà pour cet établissement. Demandez la vérification ci-dessous.");
          setShowVerifOptions(true);
        } else {
          setError(data.error || "Erreur lors de la création du profil.");
        }
      } else {
        setSuccessMsg("Profil Google Business créé. Choisissez une méthode de vérification.");
        setShowVerifOptions(true);
        router.refresh();
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setStep("idle");
    }
  }

  async function handleRequestVerification() {
    setStep("verifying");
    setError(null);

    try {
      const res = await fetch("/api/google/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId, method: verificationMethod }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la demande de vérification.");
      } else {
        setSuccessMsg(data.message);
        setShowVerifOptions(false);
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setStep("idle");
    }
  }

  async function handleSyncPhotos() {
    setStep("syncing_photos");
    setError(null);

    try {
      const res = await fetch("/api/google/sync-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la synchronisation des photos.");
      } else {
        setSuccessMsg(`${data.synced} photo(s) synchronisée(s) sur Google Maps.`);
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setStep("idle");
    }
  }

  const isLoading = step !== "idle";
  const formattedSyncDate = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // ── État 1 : Vérifié et actif ────────────────────────────
  if (isConnected && verificationStatus === "VERIFIED") {
    return (
      <div className="rounded-xl border border-border bg-surface-container-low p-5 space-y-4">
        <div className="flex items-center gap-3">
          <GoogleIcon className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Visible sur Google Maps</p>
            {formattedSyncDate && (
              <p className="text-xs text-muted-foreground">Synchronisé le {formattedSyncDate}</p>
            )}
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Actif
          </span>
        </div>

        {successMsg && (
          <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
            {successMsg}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSyncPhotos}
          disabled={isLoading}
          className="w-full rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {step === "syncing_photos" ? "Synchronisation en cours…" : "Synchroniser mes photos"}
        </button>
      </div>
    );
  }

  // ── État 2 : Connecté, vérification en attente ─────────
  if (isConnected && gbpLocationName && verificationStatus === "PENDING") {
    return (
      <div className="rounded-xl border border-border bg-surface-container-low p-5 space-y-4">
        <div className="flex items-center gap-3">
          <GoogleIcon className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Vérification en cours</p>
            <p className="text-xs text-muted-foreground">
              Consultez votre téléphone ou email pour le code Google.
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            En attente
          </span>
        </div>

        {successMsg && (
          <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
            {successMsg}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {showVerifOptions && (
          <VerificationOptions
            method={verificationMethod}
            onMethodChange={setVerificationMethod}
            onSubmit={handleRequestVerification}
            isLoading={step === "verifying"}
          />
        )}

        <button
          onClick={() => setShowVerifOptions((v) => !v)}
          className="w-full rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {showVerifOptions ? "Annuler" : "Renvoyer le code de vérification"}
        </button>
      </div>
    );
  }

  // ── État 3 : Connecté mais pas encore de fiche GBP ─────
  if (isConnected && !gbpLocationName) {
    return (
      <div className="rounded-xl border border-border bg-surface-container-low p-5 space-y-4">
        <div className="flex items-center gap-3">
          <GoogleIcon className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Compte Google connecté</p>
            <p className="text-xs text-muted-foreground">Créez votre fiche Google Maps maintenant.</p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {showVerifOptions ? (
          <VerificationOptions
            method={verificationMethod}
            onMethodChange={setVerificationMethod}
            onSubmit={handleRequestVerification}
            isLoading={step === "verifying"}
          />
        ) : (
          <button
            onClick={handleCreateBusiness}
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {step === "creating" ? "Création en cours…" : "Créer ma fiche Google Maps"}
          </button>
        )}
      </div>
    );
  }

  // ── État 4 : Non connecté ───────────────────────────────
  return (
    <div className="rounded-xl border border-border bg-surface-container-low p-5 space-y-4">
      <div className="flex items-start gap-3">
        <GoogleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Apparaître sur Google Maps</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Les clients qui cherchent votre métier dans votre ville vous trouveront directement.
            Connexion en 30 secondes.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {successMsg && (
        <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
          {successMsg}
        </p>
      )}

      <a
        href={`/api/auth/google/authorize?proId=${proId}`}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <GoogleIcon className="w-4 h-4" />
        Connecter mon compte Google
      </a>
    </div>
  );
}

// ── Sub-component: Verification method picker ───────────

function VerificationOptions({
  method,
  onMethodChange,
  onSubmit,
  isLoading,
}: {
  method: string;
  onMethodChange: (m: "PHONE_CALL" | "SMS" | "EMAIL" | "ADDRESS") => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const options = [
    { value: "SMS", label: "SMS" },
    { value: "PHONE_CALL", label: "Appel téléphonique" },
    { value: "EMAIL", label: "Email" },
    { value: "ADDRESS", label: "Courrier postal" },
  ] as const;

  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs font-medium text-foreground">Choisir la méthode de vérification</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onMethodChange(opt.value)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              method === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? "Envoi en cours…" : "Envoyer le code"}
      </button>
    </div>
  );
}

// ── Google Icon SVG ─────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
