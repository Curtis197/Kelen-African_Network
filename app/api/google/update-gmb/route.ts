// app/api/google/update-gmb/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";
import { syncLog } from "@/lib/logger";

interface HourPeriod {
  openDay: string;
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"
}

interface UpdateGMBBody {
  title?: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: {
    streetAddress?: string;
    locality?: string;
    postalCode?: string;
    countryCode?: string;
  };
  hours?: HourPeriod[];
}

function parseTime(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(":").map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

export async function POST(request: NextRequest) {
  const log = syncLog.child("update-gmb");
  log.info("→ POST /api/google/update-gmb");

  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const body: UpdateGMBBody = await request.json().catch(() => ({}));

    const tokens = await getProTokens(pro.id);
    if (!tokens) {
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
    }

    const gbpData = await getProGBPData(pro.id);
    if (!gbpData?.gbp_location_name) {
      return NextResponse.json({ error: "Google Business location not created yet" }, { status: 400 });
    }

    const authClient = await getAuthenticatedClient(tokens, pro.id);
    const businessInfo = google.mybusinessbusinessinformation({ version: "v1", auth: authClient });

    const updateMaskParts: string[] = [];
    const patchBody: Record<string, unknown> = {};

    if (body.title !== undefined) {
      patchBody.title = body.title;
      updateMaskParts.push("title");
    }

    if (body.description !== undefined) {
      patchBody.profile = { description: body.description.slice(0, 750) };
      updateMaskParts.push("profile");
    }

    if (body.phone !== undefined) {
      patchBody.phoneNumbers = { primaryPhone: body.phone };
      updateMaskParts.push("phoneNumbers");
    }

    if (body.website !== undefined) {
      patchBody.websiteUri = body.website;
      updateMaskParts.push("websiteUri");
    }

    if (body.address) {
      patchBody.storefrontAddress = {
        addressLines: body.address.streetAddress ? [body.address.streetAddress] : [],
        locality: body.address.locality ?? "",
        postalCode: body.address.postalCode ?? "",
        regionCode: body.address.countryCode ?? "SN",
      };
      updateMaskParts.push("storefrontAddress");
    }

    if (body.hours && body.hours.length > 0) {
      patchBody.regularHours = {
        periods: body.hours.map((h) => ({
          openDay: h.openDay,
          openTime: parseTime(h.openTime),
          closeDay: h.openDay,
          closeTime: parseTime(h.closeTime),
        })),
      };
      updateMaskParts.push("regularHours");
    }

    if (updateMaskParts.length === 0) {
      return NextResponse.json({ success: true, message: "Nothing to update" });
    }

    log.info("PATCHing GBP", { proId: pro.id, fields: updateMaskParts });

    await businessInfo.locations.patch({
      name: gbpData.gbp_location_name,
      updateMask: updateMaskParts.join(","),
      requestBody: patchBody,
    });

    await supabase
      .from("pro_google_tokens")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("pro_id", pro.id);

    log.info("GBP update complete", { proId: pro.id, fields: updateMaskParts });
    return NextResponse.json({ success: true, updated: updateMaskParts });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    syncLog.error("Unhandled error in update-gmb", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
