import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone: string | undefined = body?.phone;

  if (!phone || !E164_REGEX.test(phone)) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide" },
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

  try {
    const client = twilio(sid, token);
    await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phone, channel: "whatsapp" });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Twilio 60203 = max send attempts reached
    if (err?.code === 60203) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Impossible d'envoyer le code WhatsApp" },
      { status: 500 }
    );
  }
}
