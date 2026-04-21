import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCalendarAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) {
    return NextResponse.json({ error: "Professional profile not found" }, { status: 404 });
  }

  const authUrl = generateCalendarAuthUrl(pro.id);
  return NextResponse.redirect(authUrl);
}
