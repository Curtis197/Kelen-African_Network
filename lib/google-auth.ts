import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

// ──────────────────────────────────────────────
// OAuth2 client factory
// ──────────────────────────────────────────────

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function generateAuthUrl(proId: string): string {
  const client = createOAuthClient();

  const state = Buffer.from(JSON.stringify({ proId })).toString("base64");

  return client.generateAuthUrl({
    scope: ["https://www.googleapis.com/auth/business.manage"],
    state,
    access_type: "offline", // Required to get a refresh token
    prompt: "consent",       // Force consent screen so refresh token is always returned
  });
}

// ──────────────────────────────────────────────
// Token storage helpers (Supabase)
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
  const supabase = await createClient();

  const { data } = await supabase
    .from("pro_google_tokens")
    .select("*")
    .eq("pro_id", proId)
    .single();

  return data || null;
}

export async function getProGBPData(
  proId: string
): Promise<{ gbp_account_name: string | null; gbp_location_name: string | null; gbp_place_id: string | null } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pro_google_tokens")
    .select("gbp_account_name, gbp_location_name, gbp_place_id")
    .eq("pro_id", proId)
    .single();

  return data || null;
}

// ──────────────────────────────────────────────
// Token refresh — auto-renews if expiring < 5 min
// ──────────────────────────────────────────────

export async function getAuthenticatedClient(
  tokens: GoogleTokens,
  proId: string
): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const client = createOAuthClient();
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  });

  // Refresh if expiring within the next 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  const isExpiringSoon =
    tokens.expiry_date && tokens.expiry_date < Date.now() + fiveMinutes;

  if (isExpiringSoon && tokens.refresh_token) {
    const { credentials } = await client.refreshAccessToken();

    const supabase = await createClient();
    await supabase
      .from("pro_google_tokens")
      .update({
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      })
      .eq("pro_id", proId);

    client.setCredentials(credentials);
  }

  return client;
}
