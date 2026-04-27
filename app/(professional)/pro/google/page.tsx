"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";

const log = logger("kelen:google-management");

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true" || false;

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface RealizationItem {
  id: string;
  title: string;
  mainImageUrl: string | null;
}

interface ServiceItem {
  id: string;
  title: string;
  category: string | null;
}

interface ProductItem {
  id: string;
  title: string;
  category: string | null;
}

// ── Days config ───────────────────────────────────────────────────────────────

const DAYS = [
  { key: "MONDAY", label: "Lundi" },
  { key: "TUESDAY", label: "Mardi" },
  { key: "WEDNESDAY", label: "Mercredi" },
  { key: "THURSDAY", label: "Jeudi" },
  { key: "FRIDAY", label: "Vendredi" },
  { key: "SATURDAY", label: "Samedi" },
  { key: "SUNDAY", label: "Dimanche" },
] as const;

interface DayHours {
  open: boolean;
  openTime: string;
  closeTime: string;
}

type WeekHours = Record<string, DayHours>;

function defaultWeekHours(): WeekHours {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, { open: key !== "SUNDAY", openTime: "08:00", closeTime: "18:00" }])
  );
}

// ── Mock data (dev mode) ──────────────────────────────────────────────────────

const mockConnection: GoogleConnectionState = {
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

const mockDebug: DebugState = {
  envConfigured: true,
  hasClientId: true,
  hasClientSecret: true,
  hasRedirectUri: true,
  hasPlacesApiKey: true,
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GoogleManagementPage() {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [connection, setConnection] = useState<GoogleConnectionState | null>(null);
  const [debugState, setDebugState] = useState<DebugState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncingPhotos, setSyncingPhotos] = useState(false);
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [devModeOverride, setDevModeOverride] = useState<boolean | null>(null);
  const [reviewsData, setReviewsData] = useState<{ rating: number | null; totalReviews: number; reviews: any[]; featuredAuthorNames: string[] } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [featuredSelection, setFeaturedSelection] = useState<Set<string>>(new Set());
  const [savingFeatured, setSavingFeatured] = useState(false);

  // Modal states
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Content selection state
  const [realizations, setRealizations] = useState<RealizationItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedRealizationIds, setSelectedRealizationIds] = useState<Set<string>>(new Set());
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);

  // GMB edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    phone: "",
    website: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    countryCode: "SN",
  });
  const [weekHours, setWeekHours] = useState<WeekHours>(defaultWeekHours());
  const [editSaving, setEditSaving] = useState(false);

  const isDevMode = devModeOverride !== null ? devModeOverride : DEV_MODE;

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadConnectionStatus = useCallback(async () => {
    setLoadingState("loading");
    try {
      const res = await fetch("/api/google/debug");
      const report = await res.json();
      if (!res.ok) throw new Error(report.error || "Failed to load connection status");

      setDebugState(report.environment);
      const tokens = report.googleTokens;
      const isConnected = tokens?.isConnected === true;

      if (isConnected) {
        setConnection({
          isConnected: true,
          verificationStatus: tokens.verificationStatus,
          gbpAccountName: tokens.gbpAccountName,
          gbpLocationName: tokens.gbpLocationName,
          gbpPlaceId: tokens.gbpPlaceId,
          lastSyncedAt: tokens.lastSyncedAt,
          connectedAt: tokens.connectedAt,
          reviewLink: tokens.gbp_place_id
            ? `https://search.google.com/local/writereview?placeid=${tokens.gbp_place_id}`
            : null,
          allReviewsLink: tokens.gbp_place_id
            ? `https://search.google.com/local/reviews?placeid=${tokens.gbp_place_id}`
            : null,
        });
        setLoadingState("connected");
        loadReviews();
      } else {
        setLoadingState("not_connected");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLoadingState("error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReviews = useCallback(async (force = false) => {
    try {
      const res = await fetch(force ? "/api/google/reviews?refresh=1" : "/api/google/reviews");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviewsData(data);
          // Initialise selection from saved featured list
          setFeaturedSelection(new Set<string>(data.featuredAuthorNames ?? []));
        }
      }
    } catch (err) {
      log.error("Failed to load reviews", { error: err });
    }
  }, []);

  const loadContentData = useCallback(async () => {
    setContentLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pro } = await supabase.from("professionals").select("id").eq("user_id", user.id).single();
      if (!pro) return;

      const [{ data: reals }, { data: svcs }, { data: prods }] = await Promise.all([
        supabase
          .from("professional_realizations")
          .select("id, title, images:realization_images(url, is_main)")
          .eq("professional_id", pro.id)
          .order("completion_date", { ascending: false }),
        supabase
          .from("professional_services")
          .select("id, title, category")
          .eq("professional_id", pro.id),
        supabase
          .from("professional_products")
          .select("id, title, category")
          .eq("professional_id", pro.id),
      ]);

      setRealizations(
        (reals ?? []).map((r: any) => {
          const imgs: Array<{ url: string; is_main: boolean }> = r.images ?? [];
          return {
            id: r.id,
            title: r.title,
            mainImageUrl: imgs.find(i => i.is_main)?.url ?? imgs[0]?.url ?? null,
          };
        })
      );
      setServices(svcs ?? []);
      setProducts(prods ?? []);
    } catch (err) {
      log.error("Failed to load content data", { error: err });
    } finally {
      setContentLoading(false);
    }
  }, []);

  const loadProDataForEdit = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pro } = await supabase
        .from("professionals")
        .select("business_name, description, phone, slug, address, city, postal_code, country_code")
        .eq("user_id", user.id)
        .single();

      if (!pro) return;

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";
      setEditForm({
        title: pro.business_name ?? "",
        description: pro.description ?? "",
        phone: pro.phone ?? "",
        website: `${siteUrl}/professionnels/${pro.slug}`,
        streetAddress: pro.address ?? "",
        city: pro.city ?? "",
        postalCode: pro.postal_code ?? "",
        countryCode: pro.country_code ?? "SN",
      });
    } catch (err) {
      log.error("Failed to load pro data for edit", { error: err });
    }
  }, []);

  useEffect(() => {
    if (isDevMode) {
      setConnection(mockConnection);
      setDebugState(mockDebug);
      setLoadingState("connected");
      setReviewsData({ rating: 4.8, totalReviews: 12, featuredAuthorNames: [], reviews: [{ reviewer: { displayName: "Jane Doe" }, starRating: "FIVE", comment: "Excellent travail !", createTime: new Date().toISOString() }] });
    } else {
      loadConnectionStatus();
    }
  }, [isDevMode, loadConnectionStatus]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSyncProfile() {
    setSyncingProfile(true);
    setError(null);
    try {
      const res = await fetch("/api/google/sync-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync profile");
      setSuccessMsg("Profil synchronisé avec Google Maps");
      await loadConnectionStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncingProfile(false);
    }
  }

  async function handleSaveContent() {
    setContentSaving(true);
    setError(null);
    try {
      const ids = Array.from(selectedRealizationIds);
      if (ids.length === 0) {
        setIsContentModalOpen(false);
        return;
      }
      const res = await fetch("/api/google/sync-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realizationIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la synchronisation");
      setSuccessMsg(`${data.synced ?? 0} photo(s) synchronisée(s) sur Google Maps.`);
      setIsContentModalOpen(false);
      setSelectedRealizationIds(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setContentSaving(false);
    }
  }

  async function handleSaveGMB() {
    setEditSaving(true);
    setError(null);
    try {
      const hours = DAYS
        .filter(({ key }) => weekHours[key]?.open)
        .map(({ key }) => ({
          openDay: key,
          openTime: weekHours[key].openTime,
          closeTime: weekHours[key].closeTime,
        }));

      const res = await fetch("/api/google/update-gmb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          phone: editForm.phone,
          website: editForm.website,
          address: {
            streetAddress: editForm.streetAddress,
            locality: editForm.city,
            postalCode: editForm.postalCode,
            countryCode: editForm.countryCode,
          },
          hours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");
      setSuccessMsg("Profil Google Business mis à jour.");
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditSaving(false);
    }
  }

  // Derive a stable author key that works for both API formats
  function reviewAuthorName(r: any): string {
    return r.author_name ?? r.reviewer?.displayName ?? "";
  }

  function toggleFeatured(r: any) {
    const name = reviewAuthorName(r);
    if (!name) return;
    setFeaturedSelection(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handleSaveFeatured() {
    setSavingFeatured(true);
    setError(null);
    try {
      const res = await fetch("/api/google/feature-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorNames: Array.from(featuredSelection) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const count = featuredSelection.size;
      setSuccessMsg(
        count === 0
          ? "Sélection réinitialisée — tous les avis seront affichés."
          : `${count} avis sélectionné${count > 1 ? "s" : ""} — affichés sur le site et le portfolio.`
      );
      setSelectionMode(false);
      // Refresh reviewsData to reflect saved state
      await loadReviews();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingFeatured(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function openContentModal() {
    setIsContentModalOpen(true);
    loadContentData();
  }

  function openEditModal() {
    setIsEditModalOpen(true);
    loadProDataForEdit();
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function getVerificationBadge(status: string | null) {
    if (status === "VERIFIED")
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Vérifié</span>;
    if (status === "PENDING")
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">En attente</span>;
    if (status === "FAILED")
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Échoué</span>;
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Non vérifié</span>;
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (loadingState === "loading") {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-800">Erreur de chargement</p>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <button onClick={loadConnectionStatus} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dev mode banner */}
      {isDevMode && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">🧪 Mode développement — données fictives</p>
          <button onClick={() => setDevModeOverride(false)} className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200">Mode production</button>
        </div>
      )}
      {!isDevMode && DEV_MODE === false && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">Mode production (OAuth requis)</p>
          <button onClick={() => setDevModeOverride(true)} className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-900 hover:bg-blue-200">Mode dev</button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Google Business Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gérez votre présence sur Google Maps et Google Search</p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-800">{successMsg}</p>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Not connected */}
      {loadingState === "not_connected" && (
        <div className="rounded-xl border border-border bg-surface-container-low p-10 text-center">
          <div className="mb-4 text-5xl">🗺️</div>
          <h2 className="text-xl font-bold text-foreground">Apparaître sur Google Maps</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Les clients qui cherchent votre métier dans votre ville vous trouveront directement. Connexion en 30 secondes.
          </p>
          <button
            onClick={() => { window.location.href = "/api/auth/google/authorize"; }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
          >
            <GoogleIcon className="h-4 w-4" />
            Connecter mon compte Google
          </button>
        </div>
      )}

      {/* Connected */}
      {connection && (
        <div className="space-y-6">
          {/* Status card */}
          <div className="rounded-xl border border-border bg-surface-container-low p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <GoogleIcon className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    {connection.gbpLocationName || "Compte Google connecté"}
                  </p>
                  {connection.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                      Dernière synchro : {new Date(connection.lastSyncedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              {getVerificationBadge(connection.verificationStatus)}
            </div>

            {/* GBP IDs (compact) */}
            {connection.gbpLocationName && (
              <div className="mt-4 rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground space-y-1">
                <div className="flex gap-2"><span className="font-medium w-20">Account</span><code className="truncate">{connection.gbpAccountName}</code></div>
                <div className="flex gap-2"><span className="font-medium w-20">Location</span><code className="truncate">{connection.gbpLocationName}</code></div>
                {connection.gbpPlaceId && <div className="flex gap-2"><span className="font-medium w-20">Place ID</span><code className="truncate">{connection.gbpPlaceId}</code></div>}
              </div>
            )}

            {/* Action buttons */}
            {connection.gbpLocationName && (
              <div className="mt-5 flex flex-wrap gap-3">
                {/* New: Content selection */}
                <button
                  onClick={openContentModal}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span>🖼️</span> Gérer le contenu Google
                </button>

                {/* New: Edit GMB */}
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-2 rounded-lg bg-kelen-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kelen-green-700 transition-colors"
                >
                  <span>✏️</span> Modifier le profil GMB
                </button>

                {/* Existing: sync profile */}
                <button
                  onClick={handleSyncProfile}
                  disabled={syncingProfile}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {syncingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>🔄</span>}
                  Synchroniser le profil
                </button>
              </div>
            )}

            {/* Create business if no location yet */}
            {!connection.gbpLocationName && (
              <button
                onClick={async () => {
                  setError(null); setSuccessMsg(null);
                  try {
                    const res = await fetch("/api/google/create-business", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erreur");
                    setSuccessMsg("Profil Google Maps créé. Vérification requise.");
                    await loadConnectionStatus();
                  } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
                }}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity"
              >
                Créer ma fiche Google Maps
              </button>
            )}
          </div>

          {/* Review links */}
          {connection.gbpPlaceId && (
            <div className="rounded-xl border border-border bg-surface-container-low p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Liens d'avis Google</h2>
              {[
                { key: "review", label: "Lien d'avis client", sub: "À envoyer après chaque projet", url: connection.reviewLink },
                { key: "allReviews", label: "Voir tous les avis", sub: "Tous vos avis Google Maps", url: connection.allReviewsLink },
              ].map(({ key, label, sub, url }) => url && (
                <div key={key} className="rounded-lg bg-muted/60 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(url, key)}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      {copiedField === key ? "Copié ✓" : "Copier"}
                    </button>
                  </div>
                  <code className="block text-xs break-all text-muted-foreground">{url}</code>
                </div>
              ))}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Merci pour votre confiance ! Si vous êtes satisfait de mon travail, je vous invite à laisser un avis Google : ${connection.reviewLink}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Partager par WhatsApp
              </a>
            </div>
          )}

          {/* Reviews */}
          {connection.gbpLocationName && (
            <div className="rounded-xl border border-border bg-surface-container-low p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-foreground">Avis Google</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Synchronisés depuis Google Maps</p>
                </div>
                <div className="flex items-center gap-2">
                  {reviewsData && reviewsData.reviews.length > 0 && (
                    <button
                      onClick={() => {
                        if (selectionMode) {
                          // Cancel: restore saved selection
                          setFeaturedSelection(new Set<string>(reviewsData.featuredAuthorNames ?? []));
                        }
                        setSelectionMode(m => !m);
                      }}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectionMode
                          ? "border-kelen-green-600 bg-kelen-green-50 text-kelen-green-700"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {selectionMode ? "Annuler" : "✦ Sélectionner les avis"}
                    </button>
                  )}
                  <button onClick={() => loadReviews(true)} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    🔄 Actualiser
                  </button>
                </div>
              </div>

              {/* Selection mode banner */}
              {selectionMode && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-kelen-green-200 bg-kelen-green-50 px-4 py-3">
                  <p className="text-sm text-kelen-green-800">
                    {featuredSelection.size === 0
                      ? "Aucun avis sélectionné — tous seront affichés."
                      : `${featuredSelection.size} avis sélectionné${featuredSelection.size > 1 ? "s" : ""} — affichés sur le site et le portfolio.`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFeaturedSelection(new Set(reviewsData?.reviews.map(reviewAuthorName).filter(Boolean) ?? []))}
                      className="text-xs text-kelen-green-700 hover:underline"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-kelen-green-400">·</span>
                    <button
                      onClick={() => setFeaturedSelection(new Set())}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Tout désélectionner
                    </button>
                    <button
                      onClick={handleSaveFeatured}
                      disabled={savingFeatured}
                      className="ml-2 flex items-center gap-1.5 rounded-lg bg-kelen-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-kelen-green-700 disabled:opacity-50"
                    >
                      {savingFeatured && <Loader2 className="h-3 w-3 animate-spin" />}
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {!reviewsData ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>
              ) : (
                <>
                  <div className="mb-6 flex items-center gap-5 rounded-lg bg-amber-50 border border-amber-200 p-5">
                    <span className="text-4xl font-bold text-amber-500 tracking-tight">
                      {reviewsData.rating ? reviewsData.rating.toFixed(1) : "—"}
                    </span>
                    <div>
                      <div className="flex text-amber-400 text-xl">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < Math.round(reviewsData.rating ?? 0) ? "★" : "☆"}</span>
                        ))}
                      </div>
                      <p className="text-xs text-amber-700 mt-0.5">{reviewsData.totalReviews} avis</p>
                    </div>
                    {reviewsData.featuredAuthorNames?.length > 0 && !selectionMode && (
                      <span className="ml-auto text-xs text-kelen-green-700 bg-kelen-green-50 border border-kelen-green-200 rounded-full px-2.5 py-1 font-medium">
                        {reviewsData.featuredAuthorNames.length} mis en avant
                      </span>
                    )}
                  </div>

                  {reviewsData.reviews.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {reviewsData.reviews.map((r: any, i: number) => {
                        const stars = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 }[r.starRating as string] ?? r.rating ?? 0;
                        const authorName = reviewAuthorName(r);
                        const displayName = r.reviewer?.displayName ?? r.author_name ?? "Anonyme";
                        const photoUrl = r.reviewer?.profilePhotoUrl ?? r.profile_photo_url ?? null;
                        const comment = r.comment ?? r.text ?? null;
                        const dateStr = r.createTime
                          ? new Date(r.createTime).toLocaleDateString("fr-FR")
                          : (r.relative_time_description ?? "");
                        const isFeatured = featuredSelection.has(authorName);
                        const isSavedFeatured = (reviewsData.featuredAuthorNames ?? []).includes(authorName);

                        return (
                          <div
                            key={r.reviewId ?? authorName ?? i}
                            onClick={() => selectionMode && toggleFeatured(r)}
                            className={`relative rounded-lg border bg-background p-4 transition-all ${
                              selectionMode ? "cursor-pointer" : ""
                            } ${
                              selectionMode && isFeatured
                                ? "border-kelen-green-400 ring-2 ring-kelen-green-200"
                                : "border-border"
                            }`}
                          >
                            {/* Featured badge (saved state, not selection mode) */}
                            {!selectionMode && isSavedFeatured && reviewsData.featuredAuthorNames.length > 0 && (
                              <span className="absolute top-3 right-3 rounded-full bg-kelen-green-100 px-2 py-0.5 text-[10px] font-semibold text-kelen-green-700">
                                ✦ Affiché
                              </span>
                            )}

                            {/* Selection checkbox */}
                            {selectionMode && (
                              <div className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                                isFeatured
                                  ? "border-kelen-green-600 bg-kelen-green-600"
                                  : "border-border bg-background"
                              }`}>
                                {isFeatured && <span className="text-white text-xs font-bold">✓</span>}
                              </div>
                            )}

                            <div className="flex items-start gap-3 mb-3 pr-8">
                              {photoUrl ? (
                                <Image src={photoUrl} alt={displayName} width={36} height={36} className="rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                                  {displayName.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-tight truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground">{dateStr}</p>
                              </div>
                              <div className="flex shrink-0 text-amber-400 text-sm">
                                {Array.from({ length: 5 }).map((_, idx) => <span key={idx}>{idx < stars ? "★" : "☆"}</span>)}
                              </div>
                            </div>
                            {comment && (
                              <p className="text-sm leading-relaxed text-foreground line-clamp-4">{comment}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">Aucun avis trouvé.</p>
                  )}

                  {/* Sticky save bar at bottom when in selection mode on mobile */}
                  {selectionMode && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between sm:hidden">
                      <p className="text-xs text-muted-foreground">{featuredSelection.size} sélectionné{featuredSelection.size > 1 ? "s" : ""}</p>
                      <button
                        onClick={handleSaveFeatured}
                        disabled={savingFeatured}
                        className="flex items-center gap-1.5 rounded-lg bg-kelen-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {savingFeatured && <Loader2 className="h-3 w-3 animate-spin" />}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Env config warning */}
          {debugState && !debugState.envConfigured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-800 mb-2">Variables d'environnement manquantes</p>
              <ul className="text-sm text-amber-700 space-y-1">
                {!debugState.hasClientId && <li>• GOOGLE_CLIENT_ID</li>}
                {!debugState.hasClientSecret && <li>• GOOGLE_CLIENT_SECRET</li>}
                {!debugState.hasRedirectUri && <li>• GOOGLE_REDIRECT_URI</li>}
                {!debugState.hasPlacesApiKey && <li>• GOOGLE_PLACES_API_KEY</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Content selection modal ── */}
      {isContentModalOpen && (
        <ContentSelectionModal
          realizations={realizations}
          services={services}
          products={products}
          loading={contentLoading}
          saving={contentSaving}
          selectedIds={selectedRealizationIds}
          onToggleRealization={(id) => setSelectedRealizationIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          })}
          onSelectAll={() => setSelectedRealizationIds(new Set(realizations.map(r => r.id)))}
          onDeselectAll={() => setSelectedRealizationIds(new Set())}
          onSave={handleSaveContent}
          onClose={() => { setIsContentModalOpen(false); setSelectedRealizationIds(new Set()); }}
        />
      )}

      {/* ── GMB Edit modal ── */}
      {isEditModalOpen && (
        <EditGMBModal
          form={editForm}
          weekHours={weekHours}
          saving={editSaving}
          onChange={(field, value) => setEditForm(prev => ({ ...prev, [field]: value }))}
          onHoursChange={(day, field, value) => setWeekHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))}
          onSave={handleSaveGMB}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── ContentSelectionModal ──────────────────────────────────────────────────────

type ContentTab = "realizations" | "services" | "products";

function ContentSelectionModal({
  realizations,
  services,
  products,
  loading,
  saving,
  selectedIds,
  onToggleRealization,
  onSelectAll,
  onDeselectAll,
  onSave,
  onClose,
}: {
  realizations: RealizationItem[];
  services: ServiceItem[];
  products: ProductItem[];
  loading: boolean;
  saving: boolean;
  selectedIds: Set<string>;
  onToggleRealization: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ContentTab>("realizations");

  return (
    <Modal title="Contenu affiché sur Google" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        Sélectionnez les réalisations dont vous souhaitez synchroniser les photos vers Google Business. Les services et produits sont affichés à titre informatif.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1 mb-5">
        {([
          { key: "realizations", label: `Réalisations (${realizations.length})` },
          { key: "services", label: `Services (${services.length})` },
          { key: "products", label: `Produits (${products.length})` },
        ] as { key: ContentTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Realizations tab */}
          {tab === "realizations" && (
            <div className="space-y-3">
              <div className="flex gap-2 justify-end">
                <button onClick={onSelectAll} className="text-xs text-primary hover:underline">Tout sélectionner</button>
                <span className="text-xs text-muted-foreground">·</span>
                <button onClick={onDeselectAll} className="text-xs text-muted-foreground hover:underline">Tout désélectionner</button>
              </div>
              {realizations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune réalisation trouvée.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {realizations.map((r) => (
                    <label key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => onToggleRealization(r.id)}
                        className="h-4 w-4 rounded accent-kelen-green-600"
                      />
                      {r.mainImageUrl ? (
                        <div className="h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                          <Image src={r.mainImageUrl} alt={r.title} width={48} height={48} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 flex-shrink-0 rounded-md bg-muted flex items-center justify-center text-xl">🖼️</div>
                      )}
                      <span className="text-sm font-medium text-foreground flex-1 line-clamp-2">{r.title}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedIds.size > 0 && (
                <p className="text-xs text-muted-foreground text-center">{selectedIds.size} réalisation(s) sélectionnée(s) — leurs photos seront envoyées sur Google.</p>
              )}
            </div>
          )}

          {/* Services tab */}
          {tab === "services" && (
            <div className="max-h-72 overflow-y-auto space-y-2">
              {services.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun service trouvé.</p>
              ) : services.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <span className="text-lg">🔧</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">Les services sont visibles sur votre fiche GMB via la synchronisation du profil.</p>
            </div>
          )}

          {/* Products tab */}
          {tab === "products" && (
            <div className="max-h-72 overflow-y-auto space-y-2">
              {products.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucun produit trouvé.</p>
              ) : products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <span className="text-lg">📦</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">Les produits sont visibles sur votre fiche GMB via la synchronisation du profil.</p>
            </div>
          )}
        </>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Annuler</button>
        {tab === "realizations" && (
          <button
            onClick={onSave}
            disabled={saving || selectedIds.size === 0}
            className="flex items-center gap-2 rounded-lg bg-kelen-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kelen-green-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Synchroniser {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── EditGMBModal ───────────────────────────────────────────────────────────────

function EditGMBModal({
  form,
  weekHours,
  saving,
  onChange,
  onHoursChange,
  onSave,
  onClose,
}: {
  form: { title: string; description: string; phone: string; website: string; streetAddress: string; city: string; postalCode: string; countryCode: string };
  weekHours: WeekHours;
  saving: boolean;
  onChange: (field: string, value: string) => void;
  onHoursChange: (day: string, field: string, value: string | boolean) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const descLen = form.description.length;

  return (
    <Modal title="Modifier le profil Google Business" onClose={onClose} wide>
      <div className="space-y-5">
        {/* Basic info */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informations générales</legend>

          <FormField label="Nom de l'établissement">
            <input
              type="text"
              value={form.title}
              onChange={e => onChange("title", e.target.value)}
              className="input-field"
            />
          </FormField>

          <FormField label={`Description (${descLen}/750)`}>
            <textarea
              value={form.description}
              onChange={e => onChange("description", e.target.value)}
              maxLength={750}
              rows={4}
              className="input-field resize-none"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Téléphone">
              <input type="tel" value={form.phone} onChange={e => onChange("phone", e.target.value)} className="input-field" placeholder="+221 77 000 00 00" />
            </FormField>
            <FormField label="Site web">
              <input type="url" value={form.website} onChange={e => onChange("website", e.target.value)} className="input-field" />
            </FormField>
          </div>
        </fieldset>

        {/* Address */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adresse</legend>

          <FormField label="Rue / Quartier">
            <input type="text" value={form.streetAddress} onChange={e => onChange("streetAddress", e.target.value)} className="input-field" />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Ville" className="col-span-2">
              <input type="text" value={form.city} onChange={e => onChange("city", e.target.value)} className="input-field" />
            </FormField>
            <FormField label="Code postal">
              <input type="text" value={form.postalCode} onChange={e => onChange("postalCode", e.target.value)} className="input-field" />
            </FormField>
          </div>

          <FormField label="Code pays">
            <input type="text" value={form.countryCode} onChange={e => onChange("countryCode", e.target.value)} className="input-field" maxLength={2} style={{ textTransform: "uppercase" }} />
          </FormField>
        </fieldset>

        {/* Hours */}
        <fieldset>
          <button
            type="button"
            onClick={() => setHoursOpen(o => !o)}
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <span>Horaires d'ouverture</span>
            {hoursOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {hoursOpen && (
            <div className="mt-3 space-y-2">
              {DAYS.map(({ key, label }) => {
                const day = weekHours[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 w-28 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.open}
                        onChange={e => onHoursChange(key, "open", e.target.checked)}
                        className="h-4 w-4 rounded accent-kelen-green-600"
                      />
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </label>
                    {day.open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={day.openTime}
                          onChange={e => onHoursChange(key, "openTime", e.target.value)}
                          className="input-field w-28 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">→</span>
                        <input
                          type="time"
                          value={day.closeTime}
                          onChange={e => onHoursChange(key, "closeTime", e.target.value)}
                          className="input-field w-28 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Fermé</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Annuler</button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-kelen-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-kelen-green-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer sur Google
        </button>
      </div>
    </Modal>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-xl`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// Tailwind class for consistent inputs — referenced via className="input-field"
// Define globally in globals.css or use inline styles. Here we rely on the project's existing base input styles.

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
