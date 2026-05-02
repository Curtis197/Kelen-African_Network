import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { phone, name, email, role } = body ?? {};

  if (!phone || !name || !role) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 }
    );
  }

  if (!E164_REGEX.test(phone)) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide" },
      { status: 400 }
    );
  }

  const adminClient = createServiceClient();
  const sanitizedPhone = phone.replace(/\D/g, "");
  const internalEmail = `wa_${sanitizedPhone}@whatsapp.kelen.internal`;
  const userRole = role === "professional" ? "pro_pending" : "client";

  // Create the Supabase auth user
  const { data: authData, error: createError } =
    await adminClient.auth.admin.createUser({
      email: internalEmail,
      email_confirm: true,
      phone,
      phone_confirm: true,
      user_metadata: {
        display_name: name,
        role: userRole,
        phone,
        auth_method: "whatsapp",
      },
    });

  if (createError) {
    if (
      createError.message.toLowerCase().includes("already registered") ||
      createError.message.toLowerCase().includes("already exists")
    ) {
      return NextResponse.json(
        { error: "Ce numéro est déjà associé à un compte" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }

  // Upsert into public.users (handles both trigger-created and manual rows)
  await adminClient.from("users").upsert(
    {
      id: authData.user.id,
      display_name: name,
      email: email || null,
      phone,
      role: userRole,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // Generate a magic-link token the client will exchange for a real session
  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: internalEmail,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: "Compte créé mais connexion impossible, réessayez" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });
}
