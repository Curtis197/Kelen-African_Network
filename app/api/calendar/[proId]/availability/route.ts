import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/google-calendar";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params;

  try {
    const slots = await getAvailableSlots(proId);
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[api/calendar/availability] Error", String(err));
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
