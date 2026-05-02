"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MARKETING_NAV } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { 
  LogIn, Briefcase, LogOut, ShieldCheck, 
  LayoutDashboard, ChevronDown, UserCircle, 
  Award, Scale, Network, Files, UserRoundCog 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setUser(null);
          setUserRole(null);
          return;
        }
        
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
      } catch (err) {
        setUser(null);
        setUserRole(null);
      }
    };

    fetchUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setUser(session.user);
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
    { href: "/recommandation", label: "Recommander", icon: Award },
    { href: "/signal", label: "Signaler", icon: Scale },
    { href: "/projets", label: "Mes projets", icon: Network },
    { href: "/documents", label: "Documents", icon: Files },
    { href: "/parametres/profil", label: "Mon profil", icon: UserRoundCog },
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
        <div className="hidden items-center gap-6 md:flex ml-auto">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
            >
              {item.label}
            </Link>
          ))}

          {user && (
            <>
              {isClient && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-sm font-semibold text-foreground/80 hover:text-kelen-green-600 transition-colors flex items-center gap-1.5 cursor-pointer">
                    <UserCircle className="w-5 h-5" />
                    Espace Client
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {CLIENT_NAV.map((item) => (
                      <DropdownMenuItem key={item.href} className="p-0">
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 px-2 py-1.5 w-full"
                        >
                          <item.icon className="w-[18px] h-[18px] text-stone-400" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isPro && (
                <Link
                  href="/pro/dashboard"
                  className="text-sm font-semibold text-foreground/80 hover:text-kelen-green-600 transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Tableau de bord
                </Link>
              )}
            </>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-kelen-green-100 bg-kelen-green-50/50 px-4 py-2 text-sm font-bold text-kelen-green-700 transition-all hover:bg-kelen-green-100 hover:text-kelen-green-800 active:scale-95"
          >
            <ShieldCheck className="w-5 h-5" />
            VÃ©rifier un pro
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <LogOut className="w-5 h-5" />
                {signingOut ? 'DÃ©connexion...' : 'DÃ©connexion'}
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/pour-les-professionnels"
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 hover:text-amber-800 active:scale-95"
              >
                <Briefcase className="w-5 h-5" />
                Espace Pro
              </Link>
              <Link
                href="/connexion"
                className="flex items-center gap-2 rounded-xl bg-kelen-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-kelen-green-500/20 transition-all hover:bg-kelen-green-600 hover:shadow-xl active:scale-95"
              >
                <LogIn className="w-5 h-5" />
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

            {user && (
              <>
                {isClient && CLIENT_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-base font-bold text-foreground hover:text-kelen-green-600 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-stone-400" />
                    {item.label}
                  </Link>
                ))}

                {isPro && (
                  <Link
                    href="/pro/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-base font-bold text-foreground hover:text-kelen-green-600 transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5 text-stone-400" />
                    Tableau de bord
                  </Link>
                )}
              </>
            )}

            <hr className="border-border my-2" />
            
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-kelen-green-100 bg-kelen-green-50/50 py-3 text-base font-bold text-kelen-green-700 transition-all active:scale-95"
            >
              <ShieldCheck className="w-5 h-5" />
              VÃ©rifier un pro
            </Link>

            {user ? (
              <button
                onClick={() => handleSignOut()}
                disabled={signingOut}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-base font-bold text-stone-500 transition-all hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LogOut className="w-5 h-5" />
                {signingOut ? 'DÃ©connexion...' : 'DÃ©connexion'}
              </button>
            ) : (
              <>
                <Link
                  href="/pour-les-professionnels"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-base font-bold text-amber-700"
                >
                  <Briefcase className="w-5 h-5" />
                  Espace Pro
                </Link>
                <Link
                  href="/connexion"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-kelen-green-500 py-3 text-base font-bold text-white shadow-lg"
                >
                  <LogIn className="w-5 h-5" />
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
