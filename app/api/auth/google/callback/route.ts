import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

/**
 * GET /api/auth/google/callback?code=<code>&state=<base64-state>
 *
 * Handles the OAuth2 redirect from Google.
 * Exchanges the authorization code for tokens and stores them in Supabase.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
  }

  let proId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    proId = decoded.proId;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
    }

    // Use service role to store tokens (bypasses RLS for server-side write)
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await supabase.from("pro_google_tokens").upsert({
      pro_id: proId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expiry_date: tokens.expiry_date ?? null,
      connected_at: new Date().toISOString(),
    });

    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=connected`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${BASE_URL}/pro/dashboard?google=error`);
  }
}
