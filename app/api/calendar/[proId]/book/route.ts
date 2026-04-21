import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { createAppointment, getCalendarTokensPublic } from "@/lib/google-calendar";
import { sendClientConfirmationEmail, sendProNotificationEmail } from "@/lib/utils/calendar-email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params;

  let body: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    reason?: string;
    startsAt: string;
    endsAt: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { clientName, clientEmail, startsAt, endsAt } = body;
  if (!clientName || !clientEmail || !startsAt || !endsAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch pro info for event description and email
  const supabase = createServiceClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name, email")
    .eq("id", proId)
    .single();

  if (!pro) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const tokens = await getCalendarTokensPublic(proId);
  if (!tokens) {
    return NextResponse.json({ error: "Calendar not connected" }, { status: 409 });
  }

  try {
    await createAppointment(proId, {
      clientName,
      clientEmail,
      clientPhone: body.clientPhone,
      reason: body.reason,
      startsAt,
      endsAt,
      proName: pro.business_name,
      proEmail: pro.email,
    });

    // Send emails — fire & forget, don't block the response
    Promise.all([
      sendClientConfirmationEmail({
        clientEmail,
        clientName,
        proName: pro.business_name,
        startsAt,
        endsAt,
        reason: body.reason,
      }),
      sendProNotificationEmail({
        proEmail: pro.email,
        proName: pro.business_name,
        clientName,
        clientEmail,
        clientPhone: body.clientPhone,
        startsAt,
        endsAt,
        reason: body.reason,
      }),
    ]).catch((err) => console.error("[api/calendar/book] Email send failed", String(err)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/calendar/book] Error creating appointment", String(err));
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
