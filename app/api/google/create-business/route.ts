import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getAuthenticatedClient } from "@/lib/google-auth";
import { mapKelenCategoryToGBP } from "@/lib/gbp-categories";

const GBP_BUSINESS_INFO_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";

/**
 * POST /api/google/create-business
 * Body: { proId: string }
 *
 * Creates a Google Business Profile location for the professional.
 * Requires a valid connected Google account (tokens must exist).
 */
export async function POST(request: NextRequest) {
  try {
    const { proId } = await request.json();

    if (!proId) {
      return NextResponse.json({ error: "proId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Auth guard — caller must own this professional profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pro } = await supabase
      .from("professionals")
      .select("*")
      .eq("id", proId)
      .eq("user_id", user.id)
      .single();

    if (!pro) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }

    // Retrieve stored OAuth tokens
    const tokens = await getProTokens(proId);
    if (!tokens) {
      return NextResponse.json(
        { error: "Google account not connected. Please authorize first." },
        { status: 400 }
      );
    }

    const authClient = await getAuthenticatedClient(tokens, proId);

    // Step 1 — Get Google Business Account
    const accountManager = google.mybusinessaccountmanagement({
      version: "v1",
      auth: authClient,
    });

    const accountsResponse = await accountManager.accounts.list();
    const accounts = accountsResponse.data.accounts;

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No Google Business account found. Please create one at business.google.com first." },
        { status: 400 }
      );
    }

    const accountName = accounts[0].name as string;

    // Step 2 — Create the business location via REST (googleapis types don't expose POST /locations)
    const accessToken = (await authClient.getAccessToken()).token;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";
    const profileUrl = `${siteUrl}/professionnels/${pro.slug}`;

    const locationData = {
      title: pro.business_name || pro.owner_name || "Mon établissement",
      phoneNumbers: pro.phone ? { primaryPhone: pro.phone } : undefined,
      categories: {
        primaryCategory: {
          name: mapKelenCategoryToGBP(pro.category),
        },
      },
      storefrontAddress: {
        addressLines: pro.address ? [pro.address] : [],
        locality: pro.city || "",
        postalCode: pro.postal_code || "",
        regionCode: pro.country_code || "CI",
      },
      websiteUri: profileUrl,
      profile: {
        description: pro.description
          ? pro.description.slice(0, 750)
          : `Professionnel vérifié sur Kelen — ${pro.category || "Construction & Rénovation"}`,
      },
    };

    const createRes = await fetch(
      `${GBP_BUSINESS_INFO_BASE}/${accountName}/locations?requestId=kelen-${proId}-${Date.now()}&validateOnly=false`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(locationData),
      }
    );

    if (!createRes.ok) {
      const errBody = await createRes.json();
      const msg: string = errBody?.error?.message || "GBP location creation failed";
      if (msg.includes("ALREADY_EXISTS") || createRes.status === 409) {
        return NextResponse.json(
          { error: "already_exists", message: "Un profil Google Business existe déjà pour cet établissement." },
          { status: 409 }
        );
      }
      throw new Error(msg);
    }

    const location = await createRes.json();
    const locationName = location.name as string;
    const placeId = location.metadata?.placeId || null;

    // Step 3 — Store location reference
    await supabase
      .from("pro_google_tokens")
      .update({
        gbp_account_name: accountName,
        gbp_location_name: locationName,
        gbp_place_id: placeId,
        verification_status: "PENDING",
        last_synced_at: new Date().toISOString(),
      })
      .eq("pro_id", proId);

    return NextResponse.json({
      success: true,
      locationName,
      placeId,
      message: "Profil Google Business créé. La vérification est requise avant publication sur Google Maps.",
    });
  } catch (err: any) {
    console.error("GBP create-business error:", err);

    // Handle "already exists" case gracefully
    if (err?.code === 409 || err?.message?.includes("ALREADY_EXISTS")) {
      return NextResponse.json(
        {
          error: "already_exists",
          message: "Un profil Google Business existe déjà pour cet établissement.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
