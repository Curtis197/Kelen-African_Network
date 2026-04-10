"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MARKETING_NAV } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    const fetchUserAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile && !cancelled) setUserRole(profile.role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    };

    fetchUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setUser(session.user);
        // Role change may not need immediate DB fetch — middleware handles it
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setUserRole(null);
      setSigningOut(false);
      setMobileOpen(false);
      router.push("/");
      router.refresh();
    }
  }, [supabase, signingOut, router]);

  const isPro = userRole?.startsWith("pro_");
  const isAdmin = userRole === "admin";
  const isClient = userRole === "client";

  // Client-only navigation links
  const CLIENT_NAV = [
    { href: "/recommandation", label: "Recommander", icon: "award_star" },
    { href: "/signal", label: "Signaler", icon: "gavel" },
    { href: "/projets", label: "Mes projets", icon: "account_tree" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-tighter text-kelen-green-500 group-hover:scale-105 transition-transform duration-200">
            Kelen
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Marketing Nav - Always Visible */}
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
            >
              {item.label}
            </Link>
          ))}

          {/* Additional links for connected users */}
          {user && (
            <>
              {/* Show client-only links to clients */}
              {isClient && CLIENT_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-semibold text-foreground/80 hover:text-kelen-green-600 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Show pro dashboard link to pros */}
              {isPro && (
                <Link
                  href="/pro/dashboard"
                  className="text-sm font-semibold text-foreground/80 hover:text-kelen-green-600 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  Tableau de bord
                </Link>
              )}
            </>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          <Link
            href="/recherche"
            className="flex items-center gap-2 rounded-xl border border-kelen-green-100 bg-kelen-green-50/50 px-4 py-2 text-sm font-bold text-kelen-green-700 transition-all hover:bg-kelen-green-100 hover:text-kelen-green-800 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            Vérifier un pro
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <span className={`material-symbols-outlined text-[18px] ${signingOut ? 'animate-pulse' : ''}`}>logout</span>
                {signingOut ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/pro/connexion"
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 hover:text-amber-800 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">business_center</span>
                Espace Pro
              </Link>
              <Link
                href="/connexion"
                className="flex items-center gap-2 rounded-xl bg-kelen-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-kelen-green-500/20 transition-all hover:bg-kelen-green-600 hover:shadow-xl active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Connexion
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
        >
          <span
            className={`h-0.5 w-6 bg-foreground transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-foreground transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {/* Marketing Nav - Always Visible */}
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
              >
                {item.label}
              </Link>
            ))}

            {/* Additional links for connected users */}
            {user && (
              <>
                {/* Show client-only links to clients */}
                {isClient && CLIENT_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-base font-bold text-foreground hover:text-kelen-green-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-stone-400">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                {/* Show pro dashboard link to pros */}
                {isPro && (
                  <Link
                    href="/pro/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-base font-bold text-foreground hover:text-kelen-green-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-stone-400">dashboard</span>
                    Tableau de bord
                  </Link>
                )}
              </>
            )}

            <hr className="border-border my-2" />
            
            {/* Mobile Actions */}
            <Link
              href="/recherche"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-kelen-green-100 bg-kelen-green-50/50 py-3 text-base font-bold text-kelen-green-700 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">verified_user</span>
              Vérifier un pro
            </Link>

            {user ? (
              <button
                onClick={() => {
                  handleSignOut();
                }}
                disabled={signingOut}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-base font-bold text-stone-500 transition-all hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined ${signingOut ? 'animate-pulse' : ''}`}>logout</span>
                {signingOut ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            ) : (
              <>
                <Link
                  href="/pro/connexion"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-base font-bold text-amber-700"
                >
                  <span className="material-symbols-outlined">business_center</span>
                  Espace Pro
                </Link>
                <Link
                  href="/connexion"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-kelen-green-500 py-3 text-base font-bold text-white shadow-lg"
                >
                  <span className="material-symbols-outlined">login</span>
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
