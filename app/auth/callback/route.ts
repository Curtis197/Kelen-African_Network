import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // If we have a specific 'next' destination (like password reset), follow it
      if (next.includes("/mot-de-passe/reset")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise, query user role for dashboard redirection
      const { data: userRecord } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.session.user.id)
        .single();

      if (userRecord) {
        if (userRecord.role.startsWith("pro_")) {
          return NextResponse.redirect(`${origin}/pro/dashboard`);
        } else if (userRecord.role === "admin") {
          return NextResponse.redirect(`${origin}/admin`);
        } else {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/connexion?error=Impossible_de_verifier_votre_email`
  );
}
