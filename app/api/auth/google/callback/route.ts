import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { oauthLog } from "@/lib/logger";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

/**
 * GET /api/auth/google/callback?code=<code>&state=<base64-state>
 *
 * Handles the OAuth2 redirect from Google.
 * Exchanges the authorization code for tokens and stores them in Supabase.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  oauthLog.info("→ GET /api/auth/google/callback", {
    hasCode:   !!code,
    hasState:  !!state,
    oauthError: error,
  });

  // User denied access or Google returned an error
  if (error) {
    oauthLog.warn("Google OAuth denied or error returned", { error });
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=denied`);
  }

  if (!code || !state) {
    oauthLog.error("Missing code or state in callback", { hasCode: !!code, hasState: !!state });
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
  }

  // Decode state
  let proId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    proId = decoded.proId;
    oauthLog.debug("State decoded successfully", { proId });
  } catch (decodeErr: unknown) {
    oauthLog.error("Failed to decode OAuth state parameter", {
      error: decodeErr instanceof Error ? decodeErr.message : String(decodeErr),
    });
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
  }

  oauthLog.info("Exchanging authorization code for tokens", { proId });

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const start = Date.now();
    const { tokens } = await oauth2Client.getToken(code);
    const ms = Date.now() - start;

    oauthLog.debug("Token exchange response received", {
      proId,
      ms,
      hasAccessToken:  !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenType:       tokens.token_type,
      scope:           tokens.scope,
      expiryDate:      tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    });

    if (!tokens.access_token) {
      oauthLog.error("Token exchange succeeded but access_token is missing", { proId, ms });
      return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
    }

    if (!tokens.refresh_token) {
      oauthLog.warn(
        "No refresh_token received — user may have previously authorized. " +
        "Token refresh will fail once access_token expires unless re-authorized.",
        { proId }
      );
    }

    // Persist tokens
    oauthLog.debug("Persisting tokens to Supabase", { proId });
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error: upsertError } = await supabase
      .from("pro_google_tokens")
      .upsert({
        pro_id:        proId,
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expiry_date:   tokens.expiry_date   ?? null,
        connected_at:  new Date().toISOString(),
      });

    if (upsertError) {
      oauthLog.error("Failed to persist tokens to Supabase", {
        proId,
        error: upsertError.message,
        code:  upsertError.code,
      });
      return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
    }

    oauthLog.info("Google account connected successfully", { proId });
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=connected`);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    oauthLog.error("Unexpected error during OAuth callback", { proId, error: msg });
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
  }
}
