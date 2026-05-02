import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { createClient as createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { phone, code, role } = body ?? {};

  if (!phone || !code || !role) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 }
    );
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!sid || !token || !verifySid) {
    return NextResponse.json(
      { error: "Service WhatsApp non configuré" },
      { status: 503 }
    );
  }

  // Verify OTP with Twilio
  try {
    const client = twilio(sid, token);
    const check = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phone, code });

    if (check.status !== "approved") {
      return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
    }
  } catch (err: any) {
    // 20404 = verification not found (expired or already used)
    if (err?.code === 20404) {
      return NextResponse.json(
        { error: "Code expiré ou déjà utilisé" },
        { status: 400 }
      );
    }
    // 60202 = max check attempts reached
    if (err?.code === 60202) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Erreur de vérification" },
      { status: 500 }
    );
  }

  // Check if a user with this phone already exists
  const adminClient = createServiceClient();
  const { data: userData } = await adminClient
    .from("users")
    .select("id, role")
    .eq("phone", phone)
    .maybeSingle();

  if (!userData) {
    // Phone not registered — caller should proceed to profile step
    return NextResponse.json({ status: "new_user" });
  }

  // Cross-role guard
  const isPro = (userData.role as string).startsWith("pro_");
  const wantsPro = role === "professional";
  if (isPro !== wantsPro) {
    return NextResponse.json(
      {
        error: `Ce numéro est associé à un espace ${isPro ? "professionnel" : "client"}`,
        redirect: isPro ? "/pro/connexion" : "/connexion",
      },
      { status: 409 }
    );
  }

  // Existing user — generate a magic-link token so the client can open a session
  const { data: authUserData } = await adminClient.auth.admin.getUserById(
    userData.id
  );
  const email = authUserData?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Compte incompatible, contactez le support" },
      { status: 400 }
    );
  }

  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "existing",
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });
}
