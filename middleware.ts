import { type NextRequest, NextResponse } from "next/server";

// ============================================
// Kelen — Auth Middleware (skeleton)
// Activates when Supabase is connected.
// For now: passes all requests through.
// ============================================

// Protected route prefixes by role
const PROTECTED_ROUTES: Record<string, string> = {
  "/dashboard": "user",
  "/recommandation": "user",
  "/signal": "user",
  "/avis": "user",
  "/pro/": "professional",
  "/admin": "admin",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const requiredRole = Object.entries(PROTECTED_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (!requiredRole) {
    return NextResponse.next();
  }

  // TODO: When Supabase is connected, uncomment this:
  // const supabase = createServerClient(...)
  // const { data: { session } } = await supabase.auth.getSession()
  //
  // if (!session) {
  //   const redirectUrl = new URL('/connexion', request.url)
  //   redirectUrl.searchParams.set('redirect', pathname)
  //   return NextResponse.redirect(redirectUrl)
  // }
  //
  // const { data: user } = await supabase
  //   .from('users')
  //   .select('role')
  //   .eq('id', session.user.id)
  //   .single()
  //
  // if (user?.role !== requiredRole) {
  //   // Redirect to their correct dashboard
  //   const roleRedirects = { user: '/dashboard', professional: '/pro/dashboard', admin: '/admin' }
  //   return NextResponse.redirect(new URL(roleRedirects[user?.role] || '/', request.url))
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/recommandation/:path*",
    "/signal/:path*",
    "/avis/:path*",
    "/pro/:path*",
    "/admin/:path*",
  ],
};
