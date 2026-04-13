"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

const log = logger("kelen:google-management");

// Development mode: set to true to bypass OAuth and show mock UI
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true" || false;

interface GoogleConnectionState {
  isConnected: boolean;
  verificationStatus: string | null;
  gbpAccountName: string | null;
  gbpLocationName: string | null;
  gbpPlaceId: string | null;
  lastSyncedAt: string | null;
  connectedAt: string | null;
  reviewLink: string | null;
  allReviewsLink: string | null;
}

interface DebugState {
  envConfigured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRedirectUri: boolean;
  hasPlacesApiKey: boolean;
}

type LoadingState = "loading" | "connected" | "not_connected" | "error";

export default function GoogleManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<LoadingState>("loading");
  const [connection, setConnection] = useState<GoogleConnectionState | null>(null);
  const [debugState, setDebugState] = useState<DebugState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncingPhotos, setSyncingPhotos] = useState(false);
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [devModeOverride, setDevModeOverride] = useState<boolean | null>(null); // null = use env, true/false = manual override

  // DEV MODE: Mock connection state for UI development
  const mockConnectionState: GoogleConnectionState = {
    isConnected: true,
    verificationStatus: "VERIFIED",
    gbpAccountName: "accounts/12345678901234567890",
    gbpLocationName: "Mon Établissement - Test",
    gbpPlaceId: "ChIJN1t_tDeuEmsRUsoyG83frYI",
    lastSyncedAt: new Date().toISOString(),
    connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    reviewLink: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frYI",
    allReviewsLink: "https://search.google.com/local/reviews?placeid=ChIJN1t_tDeuEmsRUsoyG83frYI",
  };

  const mockDebugState: DebugState = {
    envConfigured: true,
    hasClientId: true,
    hasClientSecret: true,
    hasRedirectUri: true,
    hasPlacesApiKey: true,
  };

  // Determine if we're in dev mode (env or manual override)
  const isDevMode = devModeOverride !== null ? devModeOverride : DEV_MODE;

  // Load connection status on mount
  useEffect(() => {
    if (isDevMode) {
      log.info("[DEV MODE] Loading mock connection state");
      setConnection(mockConnectionState);
      setDebugState(mockDebugState);
      setLoading("connected");
    } else {
      loadConnectionStatus();
    }
  }, [isDevMode]);

  async function loadConnectionStatus() {
    log.info("Loading Google connection status");
    setLoading("loading");

    try {
      const response = await fetch("/api/google/debug");
      const report = await response.json();

      log.debug("Debug endpoint response", { status: response.status, report });

      if (!response.ok) {
        throw new Error(report.error || "Failed to load connection status");
      }

      setDebugState(report.environment);

      const tokens = report.googleTokens;
      const isConnected = tokens?.isConnected === true;

      if (isConnected) {
        const reviewLink = tokens?.gbp_place_id
          ? `https://search.google.com/local/writereview?placeid=${tokens.gbp_place_id}`
          : null;
        const allReviewsLink = tokens?.gbp_place_id
          ? `https://search.google.com/local/reviews?placeid=${tokens.gbp_place_id}`
          : null;

        setConnection({
          isConnected: true,
          verificationStatus: tokens.verificationStatus,
          gbpAccountName: tokens.gbpAccountName,
          gbpLocationName: tokens.gbpLocationName,
          gbpPlaceId: tokens.gbpPlaceId,
          lastSyncedAt: tokens.lastSyncedAt,
          connectedAt: tokens.connectedAt,
          reviewLink,
          allReviewsLink,
        });

        log.info("Google connection status loaded", {
          connected: true,
          verificationStatus: tokens.verificationStatus,
          hasPlaceId: !!tokens.gbpPlaceId,
        });

        setLoading("connected");
      } else {
        log.info("Not connected to Google Business");
        setLoading("not_connected");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("Failed to load connection status", { error: msg });
      setError(msg);
      setLoading("error");
    }
  }

  async function handleConnectGoogle() {
    log.info("Initiating Google OAuth connection");
    setError(null);

    // The authorize endpoint returns a redirect, not JSON
    // We need to navigate directly to the endpoint
    window.location.href = "/api/auth/google/authorize";
  }

  async function handleCreateBusiness() {
    log.info("Creating Google Business Profile");
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/google/create-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      log.info("Create business response", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Failed to create business profile");
      }

      setSuccessMsg("Profil Google Maps créé avec succès. Vérification requise.");
      log.info("Business profile created successfully");

      // Reload status
      await loadConnectionStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("Failed to create business profile", { error: msg });
      setError(msg);
    }
  }

  async function handleRequestVerification(method: "PHONE_CALL" | "SMS" | "EMAIL" | "ADDRESS") {
    log.info("Requesting verification", { method });
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/google/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });

      const data = await response.json();
      log.info("Verification request response", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Failed to request verification");
      }

      setSuccessMsg(`Code de vérification envoyé via ${method}. Vérifiez votre ${method === "SMS" || method === "PHONE_CALL" ? "téléphone" : "email"}.`);
      log.info("Verification code sent successfully", { method });

      // Reload status
      await loadConnectionStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("Failed to request verification", { error: msg });
      setError(msg);
    }
  }

  async function handleSyncPhotos() {
    log.info("Syncing photos to Google Business");
    setSyncingPhotos(true);
    setError(null);

    try {
      const response = await fetch("/api/google/sync-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      log.info("Sync photos response", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync photos");
      }

      setSuccessMsg(`${data.synced || 0} photos synchronisées avec Google Maps`);
      log.info("Photos synced successfully", { synced: data.synced });

      // Reload status
      await loadConnectionStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("Failed to sync photos", { error: msg });
      setError(msg);
    } finally {
      setSyncingPhotos(false);
    }
  }

  async function handleSyncProfile() {
    log.info("Syncing profile to Google Business");
    setSyncingProfile(true);
    setError(null);

    try {
      const response = await fetch("/api/google/sync-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      log.info("Sync profile response", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync profile");
      }

      setSuccessMsg("Profil synchronisé avec Google Maps");
      log.info("Profile synced successfully");

      // Reload status
      await loadConnectionStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("Failed to sync profile", { error: msg });
      setError(msg);
    } finally {
      setSyncingProfile(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    log.info("Copied to clipboard", { field });
  }

  function getVerificationBadge(status: string | null) {
    switch (status) {
      case "VERIFIED":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800">
            <span className="text-lg">✅</span>
            <span className="text-sm font-semibold">Vérifié sur Google Maps</span>
          </div>
        );
      case "PENDING":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
            <span className="text-lg">⏳</span>
            <span className="text-sm font-semibold">Vérification en cours</span>
          </div>
        );
      case "FAILED":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800">
            <span className="text-lg">❌</span>
            <span className="text-sm font-semibold">Vérification échouée</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800">
            <span className="text-sm font-semibold">Non vérifié</span>
          </div>
        );
    }
  }

  if (loading === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la connexion Google...</p>
        </div>
      </div>
    );
  }

  if (loading === "error") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur de chargement</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadConnectionStatus}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Dev Mode Banner */}
        {isDevMode && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧪</span>
                <div>
                  <h3 className="text-sm font-bold text-amber-800">
                    MODE DEVELOPPEMENT (OAuth bypasse)
                  </h3>
                  <p className="text-xs text-amber-700">
                    Affichage de donnees mock pour tester l'interface
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDevModeOverride(false)}
                className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-900 rounded-md hover:bg-amber-200 transition-colors"
              >
                Passer en mode Production
              </button>
            </div>
          </div>
        )}

        {/* Production mode toggle (only shown when NOT in dev mode) */}
        {!isDevMode && DEV_MODE === false && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-blue-800">
                  MODE PRODUCTION (OAuth requis)
                </h3>
                <p className="text-xs text-blue-700">
                  Connexion Google OAuth necessaire pour afficher les donnees
                </p>
              </div>
              <button
                onClick={() => setDevModeOverride(true)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 transition-colors"
              >
                Passer en mode Dev
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Google Business Profile</h1>
          <p className="text-muted-foreground">
            Gérez votre présence sur Google Maps et Google Search
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMsg && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Not Connected State */}
        {loading === "not_connected" && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Apparaître sur Google Maps
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Les clients qui cherchent un professionnel dans votre domaine et votre ville vous trouveront directement sur Google Maps.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Connexion en 30 secondes • Configuration automatique • Gratuit
            </p>
            <button
              onClick={handleConnectGoogle}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Connecter mon compte Google
            </button>
          </div>
        )}

        {/* Connected State */}
        {connection && (
          <div className="space-y-6">
            {/* Connection Status Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Statut de connexion</h2>
                  {getVerificationBadge(connection.verificationStatus)}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>Connecté le {connection.connectedAt ? new Date(connection.connectedAt).toLocaleDateString("fr-FR") : "N/A"}</div>
                  {connection.lastSyncedAt && (
                    <div>Dernière synchro: {new Date(connection.lastSyncedAt).toLocaleDateString("fr-FR")}</div>
                  )}
                </div>
              </div>

              {/* Google Business Info */}
              {connection.gbpLocationName && (
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Identifiants Google Business</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <code className="text-xs bg-background px-2 py-1 rounded">{connection.gbpAccountName || "N/A"}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <code className="text-xs bg-background px-2 py-1 rounded">{connection.gbpLocationName}</code>
                    </div>
                    {connection.gbpPlaceId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Place ID:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">{connection.gbpPlaceId}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!connection.gbpLocationName && (
                  <button
                    onClick={handleCreateBusiness}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Créer le profil Google Maps
                  </button>
                )}

                {connection.gbpLocationName && connection.verificationStatus !== "VERIFIED" && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Demander la vérification</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(["SMS", "PHONE_CALL", "EMAIL", "ADDRESS"] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => handleRequestVerification(method)}
                          className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors"
                        >
                          {method === "SMS" && "📱 SMS"}
                          {method === "PHONE_CALL" && "📞 Appel"}
                          {method === "EMAIL" && "📧 Email"}
                          {method === "ADDRESS" && "📮 Courrier"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {connection.gbpLocationName && (
                  <>
                    <button
                      onClick={handleSyncProfile}
                      disabled={syncingProfile}
                      className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      {syncingProfile ? "Synchronisation..." : "Synchroniser le profil"}
                    </button>
                    <button
                      onClick={handleSyncPhotos}
                      disabled={syncingPhotos}
                      className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      {syncingPhotos ? "Synchronisation..." : "Synchroniser les photos"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Review Links Card */}
            {connection.gbpPlaceId && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Liens d'avis Google</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                  Partagez ces liens avec vos clients après chaque projet pour collecter des avis Google.
                </p>

                <div className="space-y-4">
                  {/* Review Link */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">Lien d'avis client</h3>
                        <p className="text-xs text-muted-foreground">Pour demander un avis après un projet</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(connection.reviewLink!, "review")}
                        className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                      >
                        {copiedField === "review" ? "Copié ✓" : "Copier"}
                      </button>
                    </div>
                    <code className="block text-xs bg-background p-3 rounded break-all">
                      {connection.reviewLink}
                    </code>
                  </div>

                  {/* All Reviews Link */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">Voir tous les avis</h3>
                        <p className="text-xs text-muted-foreground">Lien vers tous vos avis Google Maps</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(connection.allReviewsLink!, "allReviews")}
                        className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                      >
                        {copiedField === "allReviews" ? "Copié ✓" : "Copier"}
                      </button>
                    </div>
                    <code className="block text-xs bg-background p-3 rounded break-all">
                      {connection.allReviewsLink}
                    </code>
                  </div>
                </div>

                {/* WhatsApp Share */}
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">
                    Envoyer par WhatsApp
                  </h3>
                  <p className="text-xs text-green-700 mb-3">
                    Message pré-rempli avec le lien d'avis Google
                  </p>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Merci pour votre confiance ! Si vous êtes satisfait de mon travail, je vous invite à laisser un avis Google : ${connection.reviewLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Ouvrir WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Environment Configuration (Debug Info) */}
            {debugState && !debugState.envConfigured && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-yellow-800 mb-3">
                  Configuration manquante
                </h2>
                <p className="text-sm text-yellow-700 mb-3">
                  Certaines variables d'environnement ne sont pas configurees:
                </p>
                <ul className="text-sm space-y-1 text-yellow-700">
                  {!debugState.hasClientId && <li>• GOOGLE_CLIENT_ID</li>}
                  {!debugState.hasClientSecret && <li>• GOOGLE_CLIENT_SECRET</li>}
                  {!debugState.hasRedirectUri && <li>• GOOGLE_REDIRECT_URI</li>}
                  {!debugState.hasPlacesApiKey && <li>• GOOGLE_PLACES_API_KEY</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
