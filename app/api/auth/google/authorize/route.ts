import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAuthUrl } from "@/lib/google-auth";

/**
 * GET /api/auth/google/authorize?proId=<uuid>
 *
 * Redirects the authenticated professional to Google's OAuth consent screen.
 * The proId is encoded in the state parameter and recovered in the callback.
 */
export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth is not configured" },
      { status: 500 }
    );
  }

  // Verify that the caller is an authenticated pro
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const proId = searchParams.get("proId");

  if (!proId) {
    return NextResponse.json({ error: "proId is required" }, { status: 400 });
  }

  // Confirm the proId belongs to the authenticated user
  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", proId)
    .eq("user_id", user.id)
    .single();

  if (!pro) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const authUrl = generateAuthUrl(proId);
  return NextResponse.redirect(authUrl);
}
