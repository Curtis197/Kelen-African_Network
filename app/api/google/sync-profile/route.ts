import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";
import { syncLog } from "@/lib/logger";

/**
 * POST /api/google/sync-profile
 * Body: { proId: string }
 *
 * Syncs the professional's Kelen profile data to their Google Business location.
 */
export async function POST(request: NextRequest) {
  const log = syncLog.child("profile");
  log.info("→ POST /api/google/sync-profile");

  try {
    const supabase = await createClient();

    // Auth guard
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      log.warn("Unauthorized request", { authError: authErr?.message });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.debug("Session verified", { userId: user.id });

    // Ownership check & Pro fetching
    const { data: pro, error: proErr } = await supabase
      .from("professionals")
      .select("id, business_name, owner_name, slug, category, phone, address, city, postal_code, country_code, description")
      .eq("user_id", user.id)
      .single();

    if (proErr || !pro) {
      log.warn("Professional not found", {
        userId:  user.id,
        dbError: proErr?.message,
      });
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const proId = pro.id;

    log.debug("Professional loaded", {
      proId,
      businessName: pro.business_name,
      hasPhone:     !!pro.phone,
      descLength:   pro.description?.length,
    });

    // Check GBP connection — skip silently if not connected
    const tokens = await getProTokens(proId);
    if (!tokens) {
      log.info("Pro has no Google tokens — skipping sync (not connected)", { proId });
      return NextResponse.json({ success: true, skipped: true });
    }

    const gbpData = await getProGBPData(proId);
    if (!gbpData?.gbp_location_name) {
      log.info("No GBP location name — skipping sync", { proId });
      return NextResponse.json({ success: true, skipped: true });
    }

    log.info("Syncing Kelen profile to GBP", {
      proId,
      gbpLocationName: gbpData.gbp_location_name,
      fields: ["title", "phoneNumbers", "websiteUri", "profile"],
    });

    const authClient    = await getAuthenticatedClient(tokens, proId);
    const businessInfo  = google.mybusinessbusinessinformation({ version: "v1", auth: authClient });
    const siteUrl       = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";

    const patchBody = {
      title:        pro.business_name,
      phoneNumbers: pro.phone ? { primaryPhone: pro.phone } : undefined,
      websiteUri:   `${siteUrl}/professionnels/${pro.slug}`,
      profile:      {
        description: pro.description ? pro.description.slice(0, 750) : undefined,
      },
    };

    log.debug("PATCH body", { proId, patchBody });

    const patchStart = Date.now();
    await businessInfo.locations.patch({
      name:       gbpData.gbp_location_name,
      updateMask: "title,phoneNumbers,websiteUri,profile",
      requestBody: patchBody,
    });
    const ms = Date.now() - patchStart;

    log.info("GBP profile sync complete", { proId, ms });

    await supabase
      .from("pro_google_tokens")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("pro_id", proId);

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    syncLog.error("Unhandled error in sync-profile", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
