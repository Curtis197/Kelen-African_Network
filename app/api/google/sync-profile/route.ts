import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";

/**
 * POST /api/google/sync-profile
 * Body: { proId: string }
 *
 * Syncs the professional's Kelen profile data to their Google Business location.
 * Called automatically when the pro updates their Kelen profile.
 */
export async function POST(request: NextRequest) {
  try {
    const { proId } = await request.json();

    if (!proId) {
      return NextResponse.json({ error: "proId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("business_name, phone, description, slug")
      .eq("id", proId)
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const tokens = await getProTokens(proId);
    if (!tokens) {
      // Not connected — skip silently (this is called as a side effect)
      return NextResponse.json({ success: true, skipped: true });
    }

    const gbpData = await getProGBPData(proId);
    if (!gbpData?.gbp_location_name) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const authClient = await getAuthenticatedClient(tokens, proId);

    const businessInfo = google.mybusinessbusinessinformation({
      version: "v1",
      auth: authClient,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

    await businessInfo.locations.patch({
      name: gbpData.gbp_location_name,
      updateMask: "title,phoneNumbers,websiteUri,profile",
      requestBody: {
        title: pro.business_name,
        phoneNumbers: pro.phone ? { primaryPhone: pro.phone } : undefined,
        websiteUri: `${siteUrl}/professionnels/${pro.slug}`,
        profile: {
          description: pro.description
            ? pro.description.slice(0, 750)
            : undefined,
        },
      },
    });

    await supabase
      .from("pro_google_tokens")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("pro_id", proId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("GBP sync-profile error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
