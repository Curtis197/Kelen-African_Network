import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient as createServiceClient } from "@/lib/supabase/service";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${BASE_URL}/pro/site?calendar=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/pro/site?calendar=error`);
  }

  let proId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    proId = decoded.proId;
  } catch {
    return NextResponse.redirect(`${BASE_URL}/pro/site?calendar=error`);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(`${BASE_URL}/pro/site?calendar=error`);
    }

    // Fetch the Google account email
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const supabase = createServiceClient();
    const { error: upsertError } = await supabase
      .from("pro_calendar_tokens")
      .upsert({
        pro_id: proId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expiry_date: tokens.expiry_date ?? null,
        google_email: userInfo.email ?? null,
        connected_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error("[calendar/callback] Failed to store tokens", upsertError);
      return NextResponse.redirect(`${BASE_URL}/pro/site?calendar=error`);
    }

    return NextResponse.redirect(`${BASE_URL}/pro/site?calendar=connected`);
  } catch (err) {
    console.error("[calendar/callback] Unexpected error", String(err));
    return NextResponse.redirect(`${BASE_URL}/pro/site?calendar=error`);
  }
}
