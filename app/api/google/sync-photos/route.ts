import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";

/**
 * POST /api/google/sync-photos
 * Body: { proId: string }
 *
 * Pushes up to 10 recent portfolio photos from Kelen to Google Business Profile.
 * Photos must be publicly accessible (Supabase Storage public URLs).
 */
export async function POST(request: NextRequest) {
  try {
    const { proId } = await request.json();

    if (!proId) {
      return NextResponse.json({ error: "proId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Auth guard
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", proId)
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const tokens = await getProTokens(proId);
    if (!tokens) {
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
    }

    const gbpData = await getProGBPData(proId);
    if (!gbpData?.gbp_location_name) {
      return NextResponse.json(
        { error: "Google Business location not created yet" },
        { status: 400 }
      );
    }

    const authClient = await getAuthenticatedClient(tokens, proId);
    const accessToken = (await authClient.getAccessToken()).token;

    // Fetch 10 most recent realization images
    const { data: images } = await supabase
      .from("realization_images")
      .select("url, professional_realizations!inner(professional_id)")
      .eq("professional_realizations.professional_id", proId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!images || images.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: "No photos to sync" });
    }

    let synced = 0;
    const errors: string[] = [];

    for (const image of images) {
      if (!image.url) continue;

      try {
        const response = await fetch(
          `https://mybusiness.googleapis.com/v4/${gbpData.gbp_location_name}/media`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mediaFormat: "PHOTO",
              locationAssociation: {
                category: "AT_WORK",
              },
              sourceUrl: image.url,
            }),
          }
        );

        if (response.ok) {
          synced++;
        } else {
          const err = await response.json();
          errors.push(err?.error?.message || "Unknown error");
        }
      } catch (photoErr: any) {
        errors.push(photoErr.message);
      }
    }

    await supabase
      .from("pro_google_tokens")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("pro_id", proId);

    return NextResponse.json({ success: true, synced, errors });
  } catch (err: any) {
    console.error("GBP sync-photos error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
