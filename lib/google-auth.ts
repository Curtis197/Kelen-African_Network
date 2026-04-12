import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { authLog } from "@/lib/logger";

// ──────────────────────────────────────────────
// OAuth2 client factory
// ──────────────────────────────────────────────

function createOAuthClient() {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI;

  authLog.debug("OAuth2 client created", {
    hasClientId:     !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri,
  });

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl(proId: string): string {
  authLog.info("Generating OAuth2 authorization URL", { proId });

  const client = createOAuthClient();
  const state  = Buffer.from(JSON.stringify({ proId })).toString("base64");

  const url = client.generateAuthUrl({
    scope:       ["https://www.googleapis.com/auth/business.manage"],
    state,
    access_type: "offline",
    prompt:      "consent",
  });

  authLog.debug("Authorization URL generated", { proId, url });
  return url;
}

// ──────────────────────────────────────────────
// Token storage helpers
// ──────────────────────────────────────────────

export interface GoogleTokens {
  pro_id: string;
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
  gbp_account_name: string | null;
  gbp_location_name: string | null;
  gbp_place_id: string | null;
  verification_status: string | null;
  connected_at: string;
  last_synced_at: string | null;
}

export async function getProTokens(proId: string): Promise<GoogleTokens | null> {
  authLog.debug("Fetching Google tokens from Supabase", { proId });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pro_google_tokens")
    .select("*")
    .eq("pro_id", proId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No row found — not connected yet, not an error
      authLog.info("No Google tokens found for pro (not yet connected)", { proId });
    } else if (error.code === "42501") {
      // EXPLICIT RLS violation
      authLog.error("❌ RLS VIOLATION (EXPLICIT) — Query blocked by Row Level Security!", {
        proId,
        table: "pro_google_tokens",
        operation: "SELECT",
        errorCode: error.code,
        errorMessage: error.message,
        hint: "Check RLS policy 'pro_google_tokens_select_own' — must allow select where pro.user_id = auth.uid()",
      });
    } else {
      authLog.error("Error fetching Google tokens", { proId, error: error.message, code: error.code });
    }
    return null;
  }

  // SILENT RLS check: 0 rows but no error could mean RLS filtered it out
  if (!data) {
    authLog.warn("⚠️ SILENT RLS FILTERING — Query succeeded but returned 0 rows", {
      proId,
      table: "pro_google_tokens",
      operation: "SELECT",
      hint: "User may not have permission to see this row, or it doesn't exist",
    });
  }

  authLog.debug("Google tokens loaded", {
    proId,
    hasAccessToken:  !!data?.access_token,
    hasRefreshToken: !!data?.refresh_token,
    expiryDate:      data?.expiry_date
      ? new Date(data.expiry_date).toISOString()
      : null,
    verificationStatus: data?.verification_status,
    gbpLocationName:    data?.gbp_location_name,
  });

  return data || null;
}

export async function getProGBPData(
  proId: string
): Promise<{ gbp_account_name: string | null; gbp_location_name: string | null; gbp_place_id: string | null } | null> {
  authLog.debug("Fetching GBP identifiers", { proId });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pro_google_tokens")
    .select("gbp_account_name, gbp_location_name, gbp_place_id")
    .eq("pro_id", proId)
    .single();

  if (error) {
    if (error.code === "42501") {
      authLog.error("❌ RLS VIOLATION (EXPLICIT) — Query blocked by Row Level Security!", {
        proId,
        table: "pro_google_tokens",
        operation: "SELECT",
        errorCode: error.code,
        errorMessage: error.message,
        hint: "Check RLS policy 'pro_google_tokens_select_own' — must allow select where pro.user_id = auth.uid()",
      });
    } else if (error.code !== "PGRST116") {
      authLog.error("Error fetching GBP identifiers", { proId, error: error.message, code: error.code });
    }
    return null;
  }

  // SILENT RLS check
  if (!data) {
    authLog.warn("⚠️ SILENT RLS FILTERING — Query succeeded but returned 0 rows", {
      proId,
      table: "pro_google_tokens",
      operation: "SELECT (gbp identifiers)",
      hint: "User may not have permission to see this row, or it doesn't exist",
    });
  }

  authLog.debug("GBP identifiers loaded", {
    proId,
    gbpAccountName:  data?.gbp_account_name,
    gbpLocationName: data?.gbp_location_name,
    gbpPlaceId:      data?.gbp_place_id,
  });

  return data || null;
}

// ──────────────────────────────────────────────
// Token refresh
// ──────────────────────────────────────────────

export async function getAuthenticatedClient(
  tokens: GoogleTokens,
  proId: string
): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const client = createOAuthClient();

  client.setCredentials({
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date:   tokens.expiry_date   ?? undefined,
  });

  const fiveMinutes   = 5 * 60 * 1000;
  const now           = Date.now();
  const expiresAt     = tokens.expiry_date ?? 0;
  const isExpiringSoon = expiresAt < now + fiveMinutes;
  const alreadyExpired = expiresAt > 0 && expiresAt < now;

  authLog.debug("Checking token validity", {
    proId,
    expiresAt:       expiresAt ? new Date(expiresAt).toISOString() : "unknown",
    alreadyExpired,
    isExpiringSoon,
    hasRefreshToken: !!tokens.refresh_token,
  });

  if (isExpiringSoon && tokens.refresh_token) {
    authLog.info("Token expiring soon — refreshing", { proId, alreadyExpired });

    try {
      const { credentials } = await client.refreshAccessToken();

      const supabase = await createClient();
      const { error: updateError } = await supabase
        .from("pro_google_tokens")
        .update({
          access_token: credentials.access_token,
          expiry_date:  credentials.expiry_date,
        })
        .eq("pro_id", proId);

      if (updateError) {
        if (updateError.code === "42501") {
          authLog.error("❌ RLS VIOLATION (EXPLICIT) — Token refresh update blocked!", {
            proId,
            table: "pro_google_tokens",
            operation: "UPDATE",
            errorCode: updateError.code,
            errorMessage: updateError.message,
            hint: "Check RLS policy 'pro_google_tokens_update_own' — must allow update where pro.user_id = auth.uid()",
          });
        } else {
          authLog.error("Failed to persist refreshed token", {
            proId,
            errorCode: updateError.code,
            errorMessage: updateError.message,
          });
        }
      } else {
        authLog.info("Token refreshed and persisted", {
          proId,
          newExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : "unknown",
        });
      }

      client.setCredentials(credentials);
    } catch (refreshErr: unknown) {
      const msg = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
      authLog.error("Token refresh failed", { proId, error: msg });
      // Continue with the existing (possibly expired) token — let the caller handle the 401
    }
  } else if (!isExpiringSoon) {
    authLog.debug("Token is valid, no refresh needed", { proId });
  } else if (!tokens.refresh_token) {
    authLog.warn("Token expiring but no refresh_token stored — re-authorization needed", { proId });
  }

  return client;
}
