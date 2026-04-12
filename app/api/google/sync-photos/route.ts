import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";
import { syncLog } from "@/lib/logger";

/**
 * POST /api/google/sync-photos
 * Body: { proId: string }
 *
 * Pushes up to 10 recent portfolio photos from Kelen to Google Business Profile.
 */
export async function POST(request: NextRequest) {
  const log = syncLog.child("photos");
  log.info("→ POST /api/google/sync-photos");

  try {
    const { proId } = await request.json();
    log.debug("Request parsed", { proId });

    if (!proId) {
      log.warn("Missing proId");
      return NextResponse.json({ error: "proId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      log.warn("Unauthorized", { proId, authError: authErr?.message });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.debug("Session verified", { userId: user.id, proId });

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", proId)
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      log.warn("Professional not found or not owned by user", { proId, userId: user.id });
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    // Load tokens
    const tokens = await getProTokens(proId);
    if (!tokens) {
      log.warn("No OAuth tokens — Google not connected", { proId });
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
    }

    const gbpData = await getProGBPData(proId);
    if (!gbpData?.gbp_location_name) {
      log.warn("GBP location not created yet", { proId, gbpData });
      return NextResponse.json(
        { error: "Google Business location not created yet" },
        { status: 400 }
      );
    }

    log.debug("GBP location ready", {
      proId,
      gbpLocationName: gbpData.gbp_location_name,
    });

    const authClient  = await getAuthenticatedClient(tokens, proId);
    const accessToken = (await authClient.getAccessToken()).token;

    // Load photos
    log.info("Fetching realization images from Supabase", { proId });
    const { data: images, error: imgErr } = await supabase
      .from("realization_images")
      .select("url, professional_realizations!inner(professional_id)")
      .eq("professional_realizations.professional_id", proId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (imgErr) {
      log.error("Failed to load realization images", { proId, error: imgErr.message });
    }

    log.debug("Realization images loaded", {
      proId,
      count: images?.length ?? 0,
    });

    if (!images || images.length === 0) {
      log.info("No photos to sync", { proId });
      return NextResponse.json({ success: true, synced: 0, message: "No photos to sync" });
    }

    let synced = 0;
    const errors: Array<{ url: string; error: string }> = [];

    for (const [i, image] of images.entries()) {
      if (!image.url) {
        log.debug(`Skipping image ${i + 1}/${images.length} — no URL`);
        continue;
      }

      log.debug(`Pushing photo ${i + 1}/${images.length}`, {
        proId,
        url: image.url,
      });

      try {
        const photoStart = Date.now();
        const response   = await fetch(
          `https://mybusiness.googleapis.com/v4/${gbpData.gbp_location_name}/media`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mediaFormat:         "PHOTO",
              locationAssociation: { category: "AT_WORK" },
              sourceUrl:           image.url,
            }),
          }
        );

        const photoMs = Date.now() - photoStart;

        if (response.ok) {
          synced++;
          log.debug(`Photo ${i + 1} synced`, { url: image.url, ms: photoMs });
        } else {
          const err = await response.json();
          const errMsg = err?.error?.message || "Unknown error";
          errors.push({ url: image.url, error: errMsg });
          log.warn(`Photo ${i + 1} failed`, {
            url:    image.url,
            status: response.status,
            error:  errMsg,
            ms:     photoMs,
          });
        }
      } catch (photoErr: unknown) {
        const msg = photoErr instanceof Error ? photoErr.message : String(photoErr);
        errors.push({ url: image.url, error: msg });
        log.error(`Photo ${i + 1} threw exception`, { url: image.url, error: msg });
      }
    }

    log.info("Photo sync complete", {
      proId,
      total:  images.length,
      synced,
      failed: errors.length,
    });

    await supabase
      .from("pro_google_tokens")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("pro_id", proId);

    return NextResponse.json({ success: true, synced, errors });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    syncLog.error("Unhandled error in sync-photos", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
