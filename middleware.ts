import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { middlewareLog } from "@/lib/logger";

// ============================================
// Kelen — Auth Middleware
// Enforces role-based access control.
// ============================================

// Simple in-memory cache for edge workers (persists until lambda is destroyed)


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

  // ── Custom domain routing ─────────────────────────────
  const host = request.headers.get("host") || "";
  const platformHosts = [
    "kelen.africa",
    "kelen-pro.com",
    "localhost:3000",
    "localhost",
  ];

  // Kelen subdomain routing: e.g. boutique-sene.kelen.africa → /professionnels/boutique-sene
  const isKelenSubdomain = (
    host.endsWith(".kelen.africa") || host.endsWith(".kelen-pro.com")
  ) && !platformHosts.includes(host);

  if (isKelenSubdomain) {
    const slug = host.split(".")[0];
    if (slug) {
      const rewriteUrl = new URL(request.url);
      const originalPath = pathname === "/" ? — : pathname;
      rewriteUrl.pathname = `/professionnels/${slug}${originalPath}`;
      middlewareLog.info(`[MIDDLEWARE] Kelen subdomain rewrite: ${host} → /professionnels/${slug}${originalPath}`, { host, slug });
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  const isCustomDomain = !platformHosts.some(
    ph => host === ph || host.endsWith(`.${ph}`)
  );

  if (isCustomDomain) {
    middlewareLog.info(`[MIDDLEWARE] Custom domain hit: ${host}${pathname}`, { host, pathname });

    // Simple in-memory cache for edge workers (persists until lambda is destroyed)
    // We keep this purely as a fallback if unstable_cache fails
    if (!(globalThis as any)._DOMAIN_CACHE) {
      (globalThis as any)._DOMAIN_CACHE = new Map<string, { slug: string | null; isVisible: boolean; expiresAt: number }>();
    }
    const FALLBACK_CACHE = (globalThis as any)._DOMAIN_CACHE;

    let slug: string | null = null;
    let isVisible = false;

    try {
      // NOTE: getCachedPortfolioByDomain is defined in lib/actions/cache-domains.ts
      const { getCachedPortfolioByDomain } = await import("@/lib/actions/cache-domains");
      const domainData = await getCachedPortfolioByDomain(host);
      slug = domainData?.slug || null;
      isVisible = domainData?.isVisible || false;
    } catch (e) {
      console.error('[MIDDLEWARE] Failed to use unstable_cache for domain lookup, using fallback:', e);
      
      const now = Date.now();
      const cached = FALLBACK_CACHE.get(host);

      if (cached && cached.expiresAt > now) {
        slug = cached.slug;
        isVisible = cached.isVisible;
        console.log('[MIDDLEWARE] Custom domain FALLBACK CACHE HIT:', { host, slug });
      } else {
        const supabaseCustom = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          {
            cookies: {
              getAll() { return request.cookies.getAll(); },
              setAll() {},
            },
          }
        );

        const { data: portfolio, error: portfolioError } = await supabaseCustom
          .from("professional_portfolio")
          .select("professional_id, professionals!inner(slug, is_visible)")
          .eq("custom_domain", host)
          .eq("domain_status", "active")
          .single();

        if (portfolioError?.code === '42501') {
          console.error('[MIDDLEWARE] [RLS] ❌ EXPLICIT RLS BLOCKING on professional_portfolio custom domain lookup!');
        }

        slug = (portfolio?.professionals as any)?.slug || null;
        isVisible = (portfolio?.professionals as any)?.is_visible || false;
        
        // Cache the result for 10 minutes (600000ms)
        FALLBACK_CACHE.set(host, { slug, isVisible, expiresAt: now + 600000 });
      }
    }

    if (!slug || !isVisible) {
      middlewareLog.warn(`[MIDDLEWARE] Custom domain not found or not visible: ${host}`, { host });
      return NextResponse.next();
    }

    const rewriteUrl = new URL(request.url);
    const originalPath = pathname === "/" ? — : pathname;
    rewriteUrl.pathname = `/professionnels/${slug}${originalPath}`;

    middlewareLog.info(`[MIDDLEWARE] Rewriting custom domain to portfolio`, { host, slug, rewritePath: rewriteUrl.pathname });
    return NextResponse.rewrite(rewriteUrl);
  }
  // ── End custom domain routing ─────────────────────────

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
                        pathname.startsWith("/favoris");
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
      middlewareLog.warn("Professional blocked from client route — redirecting to pro dashboard", {
        pathname,
        role,
      });
      return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    }

    // Professionals cannot access client routes
    if (isProRoute && isClient) {
      middlewareLog.warn("Client blocked from pro route — redirecting to client dashboard", {
        pathname,
        role,
      });
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
    // Must match ALL paths for custom domain routing to work
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
