import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getProTokens, getAuthenticatedClient } from "@/lib/google-auth";
import { mapKelenCategoryToGBP } from "@/lib/gbp-categories";
import { gbpLog } from "@/lib/logger";

const GBP_BUSINESS_INFO_BASE =
  "https://mybusinessbusinessinformation.googleapis.com/v1";

/**
 * POST /api/google/create-business
 * Body: { proId: string }
 */
export async function POST(request: NextRequest) {
  const log = gbpLog.child("create-business");
  log.info("→ POST /api/google/create-business");

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

    log.debug("Professional profile loaded", {
      proId,
      businessName: pro.business_name,
      category:     pro.category,
      city:         pro.city,
      countryCode:  pro.country_code,
      hasPhone:     !!pro.phone,
      hasAddress:   !!pro.address,
    });

    // Load OAuth tokens
    const tokens = await getProTokens(proId);
    if (!tokens) {
      log.warn("No OAuth tokens found — user must connect Google first", { proId });
      return NextResponse.json(
        { error: "Google account not connected. Please authorize first." },
        { status: 400 }
      );
    }

    log.debug("OAuth tokens loaded", {
      proId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      verificationStatus: tokens.verification_status,
    });

    const authClient = await getAuthenticatedClient(tokens, proId);

    // Step 1 — Fetch GBP accounts
    log.info("Fetching Google Business accounts list", { proId });
    const accountManager = google.mybusinessaccountmanagement({
      version: "v1",
      auth: authClient,
    });

    const accountsStart = Date.now();
    const accountsResponse = await accountManager.accounts.list();
    const accounts = accountsResponse.data.accounts;

    log.debug("Accounts list response", {
      proId,
      ms:           Date.now() - accountsStart,
      accountCount: accounts?.length ?? 0,
      accounts:     accounts?.map((a) => ({ name: a.name, type: a.type })),
    });

    if (!accounts || accounts.length === 0) {
      log.warn("No Google Business accounts found for this user", { proId });
      return NextResponse.json(
        { error: "No Google Business account found. Please create one at business.google.com first." },
        { status: 400 }
      );
    }

    const accountName = accounts[0].name as string;
    log.info("Using Google Business account", { proId, accountName });

    // Step 2 — Create location via REST
    const accessToken = (await authClient.getAccessToken()).token;
    const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL || "https://kelen.africa";
    const profileUrl  = `${siteUrl}/professionnels/${pro.slug}`;
    const gbpCategory = mapKelenCategoryToGBP(pro.category);

    const locationData = {
      title: pro.business_name || pro.owner_name || "Mon établissement",
      phoneNumbers: pro.phone ? { primaryPhone: pro.phone } : undefined,
      categories:   {
        primaryCategory: { name: gbpCategory },
      },
      storefrontAddress: {
        addressLines: pro.address ? [pro.address] : [],
        locality:     pro.city        || "",
        postalCode:   pro.postal_code || "",
        regionCode:   pro.country_code || "CI",
      },
      websiteUri: profileUrl,
      profile: {
        description: pro.description
          ? pro.description.slice(0, 750)
          : `Professionnel vérifié sur Kelen — ${pro.category || "Construction & Rénovation"}`,
      },
    };

    log.info("Creating GBP location", {
      proId,
      accountName,
      title:       locationData.title,
      category:    gbpCategory,
      city:        locationData.storefrontAddress.locality,
      countryCode: locationData.storefrontAddress.regionCode,
      websiteUri:  locationData.websiteUri,
    });

    const createUrl = `${GBP_BUSINESS_INFO_BASE}/${accountName}/locations?requestId=kelen-${proId}-${Date.now()}&validateOnly=false`;
    log.debug("POST to GBP API", { url: createUrl });

    const createStart = Date.now();
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(locationData),
    });

    const ms = Date.now() - createStart;
    log.debug("GBP location create response", {
      proId,
      status: createRes.status,
      ok:     createRes.ok,
      ms,
    });

    if (!createRes.ok) {
      const errBody = await createRes.json();
      const msg: string = errBody?.error?.message || "GBP location creation failed";

      log.error("GBP location creation failed", {
        proId,
        status:     createRes.status,
        errorMsg:   msg,
        errorCode:  errBody?.error?.code,
        errorDetails: errBody?.error?.details,
        ms,
      });

      if (msg.includes("ALREADY_EXISTS") || createRes.status === 409) {
        return NextResponse.json(
          { error: "already_exists", message: "Un profil Google Business existe déjà pour cet établissement." },
          { status: 409 }
        );
      }
      throw new Error(msg);
    }

    const location   = await createRes.json();
    const locationName = location.name as string;
    const placeId      = location.metadata?.placeId || null;

    log.info("GBP location created", {
      proId,
      locationName,
      placeId,
      ms,
    });

    // Step 3 — Persist to Supabase
    log.debug("Updating Supabase with GBP location", {
      proId,
      locationName,
      placeId,
      table: "pro_google_tokens",
    });

    const { error: updateErr } = await supabase
      .from("pro_google_tokens")
      .update({
        gbp_account_name:    accountName,
        gbp_location_name:   locationName,
        gbp_place_id:        placeId,
        verification_status: "PENDING",
        last_synced_at:      new Date().toISOString(),
      })
      .eq("pro_id", proId);

    if (updateErr) {
      if (updateErr.code === "42501") {
        log.error("❌ RLS VIOLATION (EXPLICIT) — Update blocked by Row Level Security!", {
          proId,
          table: "pro_google_tokens",
          errorCode: updateErr.code,
          errorMessage: updateErr.message,
          hint: "Check RLS policy 'pro_google_tokens_update_own' — must allow update where pro.user_id = auth.uid()",
        });
      } else {
        log.error("Failed to persist GBP location to Supabase", {
          proId,
          table: "pro_google_tokens",
          errorCode: updateErr.code,
          errorMessage: updateErr.message,
        });
      }
    } else {
      log.info("GBP identifiers persisted to Supabase", { proId, locationName, placeId });
    }

    return NextResponse.json({
      success: true,
      locationName,
      placeId,
      message: "Profil Google Business créé. La vérification est requise avant publication sur Google Maps.",
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    gbpLog.error("Unhandled error in create-business", { error: msg });

    if (msg.includes("ALREADY_EXISTS")) {
      return NextResponse.json(
        { error: "already_exists", message: "Un profil Google Business existe déjà pour cet établissement." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
