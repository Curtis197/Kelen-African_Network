import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { middlewareLog } from "@/lib/logger";

// ============================================
// Kelen — Auth Middleware
// Enforces role-based access control.
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Early return for internal paths and static assets to prevent timeouts
  if (
    pathname.includes("_next") ||
    pathname.includes("favicon.ico") ||
    pathname.includes("sso-api") ||
    pathname.endsWith(".json") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  // Log all GBP-related route hits for debugging
  const isGBPRoute =
    pathname.startsWith("/api/auth/google") ||
    pathname.startsWith("/api/google");

  if (isGBPRoute) {
    middlewareLog.info(`GBP route hit: ${request.method} ${pathname}`, {
      method:    request.method,
      pathname,
      hasAuth:   !!request.cookies.get("sb-access-token") ||
                 request.headers.get("authorization") !== null,
      userAgent: request.headers.get("user-agent")?.slice(0, 80),
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Define Route Protection Rules (outside try block for catch block access)
  const isClientAuthPage = pathname.startsWith("/connexion") ||
                           pathname.startsWith("/inscription");
  const isProAuthPage = pathname.startsWith("/pro/connexion") ||
                        pathname.startsWith("/pro/inscription");
  const isAuthPage = isClientAuthPage || isProAuthPage;
  const isClientRoute = pathname === "/dashboard" ||
                        pathname.startsWith("/dashboard/") ||
                        pathname.startsWith("/projets") ||
                        pathname.startsWith("/recommandation") ||
                        pathname.startsWith("/signal") ||
                        pathname.startsWith("/avis") ||
                        pathname.startsWith("/favoris") ||
                        pathname.startsWith("/recherche");
  const isProRoute = pathname.startsWith("/pro/") && !isAuthPage;
  const isAdminRoute = pathname.startsWith("/admin");

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This will refresh the session if needed
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 2. Handle Authentication
    if (!session) {
      if (isClientRoute || isProRoute || isAdminRoute) {
        // Redirect to the appropriate login page based on route type
        const redirectUrl = new URL(
          isProRoute ? "/pro/connexion" : "/connexion", 
          request.url
        );
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }
      return response;
    }

    // 3. Handle Role-Based Access
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const role = user?.role || "client";
    const isPro = role.startsWith("pro_");
    const isAdmin = role === "admin";
    const isClient = role === "client";

    // Redirect logged-in users away from auth pages to their dashboards
    if (isAuthPage) {
      if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
      if (isPro) return NextResponse.redirect(new URL("/pro/dashboard", request.url));
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // STRICT CROSS-ROLE PROTECTION
    // Clients cannot access professional routes
    if (isClientRoute && isPro) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Professionals cannot access client routes
    if (isProRoute && isClient) {
      return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    }
    
    // Admins can access both client and pro routes
    if (isClientRoute && !isClient && !isAdmin) {
      return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    }

    if (isProRoute && !isPro && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    middlewareLog.error("Middleware auth error", { pathname, error: msg });
    const loginUrl = new URL(
      isProRoute ? "/pro/connexion" : "/connexion",
      request.url
    );
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projets/:path*",
    "/recommandation/:path*",
    "/signal/:path*",
    "/avis/:path*",
    "/favoris/:path*",
    "/recherche/:path*",
    "/pro/:path*",
    "/admin/:path*",
    "/connexion/:path*",
    "/inscription/:path*",
    // Google Business routes — logged for debugging
    "/api/auth/google/:path*",
    "/api/google/:path*",
  ],
};
