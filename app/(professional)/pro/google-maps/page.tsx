import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoogleBusinessConnect } from "@/components/pro/GoogleBusinessConnect";
import { getGoogleReviewLink } from "@/lib/google-reviews";
import {
  CopyButton,
  SyncPhotosButton,
  SyncProfileButton,
  WhatsAppIcon,
} from "@/components/pro/GoogleMapsClientActions";

export const metadata: Metadata = {
  title: "Google Maps — Kelen Pro",
};

export default async function GoogleMapsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, slug, category, city, country")
    .eq("user_id", user.id)
    .single();

  if (!pro) redirect("/pro/profil");

  const { data: tokens } = await supabase
    .from("pro_google_tokens")
    .select("access_token, gbp_location_name, gbp_place_id, verification_status, last_synced_at, connected_at")
    .eq("pro_id", pro.id)
    .single();

  const { data: reviewsCache } = await supabase
    .from("pro_google_reviews_cache")
    .select("rating, total_reviews, cached_at")
    .eq("pro_id", pro.id)
    .single();

  const isConnected        = !!tokens?.access_token;
  const verificationStatus = tokens?.verification_status ?? null;
  const gbpLocationName    = tokens?.gbp_location_name   ?? null;
  const gbpPlaceId         = tokens?.gbp_place_id        ?? null;
  const lastSyncedAt       = tokens?.last_synced_at      ?? null;
  const connectedAt        = tokens?.connected_at        ?? null;
  const reviewLink         = getGoogleReviewLink(gbpPlaceId);

  const statusLabel =
    verificationStatus === "VERIFIED"
      ? { text: "Vérifié — visible sur Google Maps", color: "text-green-600 dark:text-green-400", dot: "bg-green-500", pulse: true }
      : verificationStatus === "PENDING"
      ? { text: "Vérification en attente", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", pulse: false }
      : isConnected
      ? { text: "Connecté — fiche non créée", color: "text-blue-600 dark:text-blue-400", dot: "bg-blue-400", pulse: false }
      : { text: "Non connecté", color: "text-muted-foreground", dot: "bg-muted-foreground/40", pulse: false };

  const whatsappMsg = reviewLink
    ? encodeURIComponent(
        `Bonjour,\n\nMerci pour votre confiance. Si vous êtes satisfait de mon travail, je vous invite à laisser un avis Google :\n${reviewLink}`
      )
    : "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Google Maps</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre présence sur Google Maps et collectez des avis clients.
        </p>
      </div>

      {/* Status hero card */}
      <div className="rounded-xl border border-border bg-surface-container-low p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusLabel.dot} ${
              statusLabel.pulse ? "animate-pulse" : ""
            }`}
          />
          <div>
            <p className={`text-sm font-semibold ${statusLabel.color}`}>
              {statusLabel.text}
            </p>
            {connectedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Connecté le{" "}
                {new Date(connectedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                Dernière sync :{" "}
                {new Date(lastSyncedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        {verificationStatus === "VERIFIED" && (
          <a
            href="https://business.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Ouvrir Google Business →
          </a>
        )}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Connection & management */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Connexion &amp; Vérification
          </h2>
          <GoogleBusinessConnect
            proId={pro.id}
            isConnected={isConnected}
            verificationStatus={verificationStatus}
            lastSyncedAt={lastSyncedAt}
            gbpLocationName={gbpLocationName}
          />
        </div>

        {/* Right: Review link + stats */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Avis clients Google
          </h2>

          <div className="rounded-xl border border-border bg-surface-container-low p-5 space-y-4">
            {reviewLink ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-foreground">Lien d&apos;avis Google</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Partagez ce lien à vos clients après chaque chantier terminé.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={reviewLink}
                    className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground font-mono truncate"
                  />
                  <CopyButton text={reviewLink} />
                </div>
                <a
                  href={`https://wa.me/?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Envoyer par WhatsApp
                </a>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {isConnected && gbpLocationName
                    ? "Votre fiche doit être vérifiée pour générer un lien d'avis."
                    : "Connectez votre compte Google pour obtenir votre lien d'avis."}
                </p>
              </div>
            )}
          </div>

          {/* Google reviews stats */}
          {reviewsCache && reviewsCache.total_reviews > 0 && (
            <div className="rounded-xl border border-border bg-surface-container-low p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Vos avis Google</p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {reviewsCache.rating != null ? Number(reviewsCache.rating).toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Note moyenne</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{reviewsCache.total_reviews}</p>
                  <p className="text-xs text-muted-foreground">Avis au total</p>
                </div>
              </div>
              {reviewsCache.cached_at && (
                <p className="text-xs text-muted-foreground mt-3">
                  Actualisé le{" "}
                  {new Date(reviewsCache.cached_at).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photo sync */}
      {isConnected && gbpLocationName && (
        <div className="rounded-xl border border-border bg-surface-container-low p-6 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Photos Google Maps</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synchronisez vos réalisations Kelen directement sur votre fiche Google Maps
              (10 photos maximum recommandées).
            </p>
          </div>
          <SyncPhotosButton proId={pro.id} />
        </div>
      )}

      {/* Profile sync */}
      {isConnected && gbpLocationName && (
        <div className="rounded-xl border border-border bg-surface-container-low p-6 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Synchroniser le profil</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mettez à jour votre fiche Google Maps avec les données actuelles de votre profil Kelen.
            </p>
          </div>
          <SyncProfileButton proId={pro.id} />
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border border-dashed border-border p-6 space-y-3">
        <p className="text-sm font-semibold text-foreground">Comment ça fonctionne ?</p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
          <li>Connectez votre compte Google en cliquant sur le bouton ci-dessus.</li>
          <li>Kelen crée automatiquement votre fiche Google Business à partir de votre profil.</li>
          <li>Google vous envoie un code de vérification (SMS, appel ou email).</li>
          <li>Une fois vérifié, vous apparaissez sur Google Maps pour votre métier et votre ville.</li>
          <li>Partagez votre lien d'avis à chaque client satisfait pour booster votre réputation.</li>
        </ol>
        <p className="text-xs text-muted-foreground pt-1">
          L&apos;accès à l&apos;API Google Business requiert une approbation Google (1 à 3 jours ouvrés).{" "}
          <a
            href="https://developers.google.com/my-business/content/prereqs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            En savoir plus
          </a>
        </p>
      </div>
    </div>
  );
}
