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
      if (next.includes("/mot-de-passe/reset")) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const role = data.session.user.user_metadata?.role as string | undefined;

      if (role?.startsWith("pro_")) {
        return NextResponse.redirect(`${origin}/pro/dashboard`);
      } else if (role === "admin") {
        return NextResponse.redirect(`${origin}/admin`);
      } else {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
  }

  return NextResponse.redirect(
    `${origin}/connexion?error=Impossible_de_verifier_votre_email`
  );
}
