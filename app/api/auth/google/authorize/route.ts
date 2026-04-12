import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAuthUrl } from "@/lib/google-auth";
import { oauthLog } from "@/lib/logger";

/**
 * GET /api/auth/google/authorize?proId=<uuid>
 *
 * Redirects the authenticated professional to Google's OAuth consent screen.
 */
export async function GET(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const proId = searchParams.get("proId");

  oauthLog.info("→ GET /api/auth/google/authorize", {
    proId,
    userAgent: request.headers.get("user-agent")?.slice(0, 80),
  });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    oauthLog.error("Google OAuth env vars not configured", {
      hasClientId:     !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRedirectUri:  !!process.env.GOOGLE_REDIRECT_URI,
    });
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  // Auth guard — must be a logged-in pro
  oauthLog.debug("Verifying session", { proId });
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    oauthLog.warn("Unauthorized request — no active session", {
      proId,
      authError: authError?.message,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  oauthLog.debug("Session verified", { userId: user.id, proId });

  if (!proId) {
    oauthLog.warn("Missing proId query parameter");
    return NextResponse.json({ error: "proId is required" }, { status: 400 });
  }

  // Confirm ownership
  const { data: pro, error: proError } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", proId)
    .eq("user_id", user.id)
    .single();

  if (proError || !pro) {
    oauthLog.warn("Professional not found or not owned by user", {
      proId,
      userId:   user.id,
      dbError:  proError?.message,
    });
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  oauthLog.info("Ownership confirmed — generating auth URL", { proId, userId: user.id });

  const authUrl = generateAuthUrl(proId);

  oauthLog.info("Redirecting to Google OAuth consent screen", {
    proId,
    redirectTo: authUrl.split("?")[0], // log base URL only, not state
  });

  return NextResponse.redirect(authUrl);
}
