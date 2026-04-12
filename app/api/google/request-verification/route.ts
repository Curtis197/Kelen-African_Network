import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getProGBPData, getAuthenticatedClient } from "@/lib/google-auth";

type VerificationMethod = "PHONE_CALL" | "SMS" | "EMAIL" | "ADDRESS";

/**
 * POST /api/google/request-verification
 * Body: { proId: string; method: VerificationMethod }
 *
 * Triggers a verification request for the Google Business location.
 * Google will send a code via the chosen method (phone, SMS, email, or postcard).
 */
export async function POST(request: NextRequest) {
  try {
    const { proId, method } = (await request.json()) as {
      proId: string;
      method: VerificationMethod;
    };

    if (!proId || !method) {
      return NextResponse.json(
        { error: "proId and method are required" },
        { status: 400 }
      );
    }

    const validMethods: VerificationMethod[] = ["PHONE_CALL", "SMS", "EMAIL", "ADDRESS"];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: `Invalid method. Must be one of: ${validMethods.join(", ")}` },
        { status: 400 }
      );
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

    const verifications = google.mybusinessverifications({
      version: "v1",
      auth: authClient,
    });

    const verificationResponse = await verifications.locations.verify({
      name: gbpData.gbp_location_name,
      requestBody: { method },
    });

    const verificationId = verificationResponse.data.verification?.name;

    return NextResponse.json({
      success: true,
      verificationId,
      message: `Code de vérification envoyé via ${
        method === "PHONE_CALL"
          ? "appel téléphonique"
          : method === "SMS"
          ? "SMS"
          : method === "EMAIL"
          ? "email"
          : "courrier postal"
      }.`,
    });
  } catch (err: any) {
    console.error("GBP request-verification error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
