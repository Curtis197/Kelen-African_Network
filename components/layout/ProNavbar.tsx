"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Briefcase,
  Award,
  LayoutGrid,
  AlertTriangle,
  Gem,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

const NAV_ITEMS = [
  { href: "/pro/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/pro/projets", label: "Projets", icon: Briefcase },
  { href: "/pro/realisations", label: "Réalisations", icon: Award },
  { href: "/pro/portfolio", label: "Portfolio", icon: LayoutGrid },
  { href: "/pro/abonnement", label: "Abonnement", icon: Gem },
  { href: "/pro/analytique", label: "Analytique", icon: BarChart3 },
];

const MORE_ITEMS = [
  { href: "/pro/profil", label: "Mon profil", icon: Award },
  { href: "/pro/recommandations", label: "Recommandations", icon: Award },
  { href: "/pro/signal", label: "Signaux", icon: AlertTriangle },
];

export function ProNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("Mon profil");
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch user info and listen for auth state changes
  useEffect(() => {
    let cancelled = false;


    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Clear local state on auth error
          if (!cancelled) {
            setUserEmail(null);
            setBusinessName("Mon profil");
          }
          return;
        }
        
        if (cancelled) {
          return;
        }
        if (session?.user) {
          setUserEmail(session.user.email ?? null);
          const { data: profile } = await supabase
            .from("professionals")
            .select("business_name")
            .eq("user_id", session.user.id)
            .single();
          if (profile?.business_name && !cancelled) {
            setBusinessName(profile.business_name);
          }
        } else {
          setUserEmail(null);
          setBusinessName("Mon profil");
        }
      } catch (err) {
        if (!cancelled) {
          setUserEmail(null);
          setBusinessName("Mon profil");
        }
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
      } else {
        setUserEmail(null);
        setBusinessName("Mon profil");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Escape key handler for mobile drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  // Body scroll lock for mobile drawer
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      first?.focus();

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      };
      drawerRef.current.addEventListener("keydown", handleTab);
      return () => drawerRef.current?.removeEventListener("keydown", handleTab);
    }
  }, [mobileOpen]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return; // prevent double-click
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
    } finally {
      setUserEmail(null);
      setBusinessName("Mon profil");
      setMoreOpen(false);
      setSigningOut(false);
      router.push("/");
      router.refresh();
    }
  }, [supabase, signingOut, router]);

  return (
    <>
      {/* Desktop navbar */}
      <header className="hidden lg:flex sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between w-full px-6 h-16">
          {/* Left: Brand + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/pro/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold text-on-surface">Kelen</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-kelen-green-100 text-kelen-green-700">
                Pro
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-kelen-green-50 text-kelen-green-700"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* More dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    MORE_ITEMS.some(i => pathname === i.href || pathname?.startsWith(i.href + "/"))
                      ? "bg-kelen-green-50 text-kelen-green-700"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  Plus
                  <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                </button>

                {moreOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-surface-container-low rounded-xl shadow-xl border border-border overflow-hidden py-1 z-50">
                    {MORE_ITEMS.map((item) => {
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-kelen-green-50 text-kelen-green-700"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Notifications + User + Sign out */}
          <div className="flex items-center gap-2">
            <NotificationDropdown />

            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-on-surface truncate max-w-32">{businessName}</p>
                <p className="text-xs text-on-surface-variant truncate max-w-32">{userEmail ?? "Chargement..."}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut className={`w-4 h-4 ${signingOut ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/pro/dashboard" className="flex items-center gap-2">
            <span className="text-base font-bold text-on-surface">Kelen</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-kelen-green-100 text-kelen-green-700">
              Pro
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <NotificationDropdown />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu Pro">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="fixed inset-y-0 right-0 w-72 bg-surface shadow-xl overflow-y-auto border-l border-border"
            tabIndex={-1}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <span className="text-sm font-bold text-on-surface">Menu Pro</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-on-surface">{businessName}</p>
              <p className="text-xs text-on-surface-variant">{userEmail ?? "Chargement..."}</p>
            </div>

            {/* Nav items */}
            <nav className="p-2 space-y-0.5">
              {[...NAV_ITEMS, ...MORE_ITEMS].map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-kelen-green-50 text-kelen-green-700"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom actions */}
            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                disabled={signingOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LogOut className={`w-4 h-4 ${signingOut ? 'animate-pulse' : ''}`} />
                {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
