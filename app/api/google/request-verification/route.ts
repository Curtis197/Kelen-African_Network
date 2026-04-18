import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";
import { gbpLog } from "@/lib/logger";

type VerificationMethod = "PHONE_CALL" | "SMS" | "EMAIL" | "ADDRESS";

/**
 * POST /api/google/request-verification
 * Body: { proId: string; method: VerificationMethod }
 */
export async function POST(request: NextRequest) {
  const log = gbpLog.child("request-verification");
  log.info("→ POST /api/google/request-verification");

  try {
    const body = await request.json().catch(() => ({}));
    const { method } = body as { method: VerificationMethod };

    log.debug("Request parsed", { method });

    if (!method) {
      log.warn("Missing method", { method });
      return NextResponse.json({ error: "method is required" }, { status: 400 });
    }

    const validMethods: VerificationMethod[] = ["PHONE_CALL", "SMS", "EMAIL", "ADDRESS"];
    if (!validMethods.includes(method)) {
      log.warn("Invalid verification method", { method, validMethods });
      return NextResponse.json(
        { error: `Invalid method. Must be one of: ${validMethods.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      log.warn("Unauthorized", { authError: authErr?.message });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      log.warn("Professional not found", { userId: user.id });
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    const proId = pro.id;

    const tokens = await getProTokens(proId);
    if (!tokens) {
      log.warn("No OAuth tokens — Google not connected", { proId });
      return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
    }

    const gbpData = await getProGBPData(proId);
    if (!gbpData?.gbp_location_name) {
      log.warn("GBP location not created yet", { proId });
      return NextResponse.json(
        { error: "Google Business location not created yet" },
        { status: 400 }
      );
    }

    log.info("Requesting verification", {
      proId,
      method,
      gbpLocationName: gbpData.gbp_location_name,
    });

    const authClient    = await getAuthenticatedClient(tokens, proId);
    const verifications = google.mybusinessverifications({ version: "v1", auth: authClient });

    const verifStart    = Date.now();
    const verifResponse = await verifications.locations.verify({
      name:        gbpData.gbp_location_name,
      requestBody: { method },
    });
    const ms = Date.now() - verifStart;

    const verificationId = verifResponse.data.verification?.name;

    log.info("Verification request submitted", {
      proId,
      method,
      verificationId,
      ms,
    });

    const methodLabel: Record<VerificationMethod, string> = {
      SMS:        "SMS",
      PHONE_CALL: "appel téléphonique",
      EMAIL:      "email",
      ADDRESS:    "courrier postal",
    };

    return NextResponse.json({
      success: true,
      verificationId,
      message: `Code de vérification envoyé via ${methodLabel[method]}.`,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    gbpLog.error("Unhandled error in request-verification", { error: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
