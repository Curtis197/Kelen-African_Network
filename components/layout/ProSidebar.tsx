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
  ShieldCheck,
  Gem,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  FileText,
  Handshake,
} from "lucide-react";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

const NAV_ITEMS = [
  { href: "/pro/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/pro/projets", label: "Projets", icon: Briefcase },
  { href: "/pro/collaborations", label: "Collaborations", icon: Handshake },
  { href: "/pro/documents", label: "Documents", icon: FileText },
  { href: "/pro/realisations", label: "Réalisations", icon: Award },
  { href: "/pro/portfolio", label: "Portfolio", icon: LayoutGrid },
  { href: "/pro/validation", label: "Validation", icon: ShieldCheck },
  { href: "/pro/abonnement", label: "Abonnement", icon: Gem },
  { href: "/pro/analytique", label: "Analytique", icon: BarChart3 },
];

export function ProSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("Mon profil");
  const [signingOut, setSigningOut] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    console.log('[ProSidebar] useEffect mounted — fetching session');

    const getUser = async () => {
      console.log('[ProSidebar] getSession() called');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[ProSidebar] Session fetch error:', error.message, error.code);
          if (!cancelled) {
            setUserEmail(null);
            setBusinessName("Mon profil");
          }
          return;
        }
        
        if (cancelled) {
          console.log('[ProSidebar] getSession returned — component unmounted, skipping');
          return;
        }
        if (session?.user) {
          console.log('[ProSidebar] Session found:', session.user.email);
          setUserEmail(session.user.email ?? null);
          const { data: profile } = await supabase
            .from("professionals")
            .select("business_name")
            .eq("user_id", session.user.id)
            .single();
          if (profile?.business_name && !cancelled) {
            console.log('[ProSidebar] Business name set:', profile.business_name);
            setBusinessName(profile.business_name);
          }
        } else {
          console.log('[ProSidebar] No session found — clearing user state');
          setUserEmail(null);
          setBusinessName("Mon profil");
        }
      } catch (err) {
        console.error('[ProSidebar] Unexpected error fetching session:', err);
        if (!cancelled) {
          setUserEmail(null);
          setBusinessName("Mon profil");
        }
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      console.log('[ProSidebar] onAuthStateChange:', event, session?.user?.email ?? 'no user');
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
      } else {
        console.log('[ProSidebar] Auth event cleared session');
        setUserEmail(null);
        setBusinessName("Mon profil");
      }
    });

    return () => {
      console.log('[ProSidebar] useEffect cleanup — unmounting');
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  // Body scroll lock
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
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUserEmail(null);
      setBusinessName("Mon profil");
      setSigningOut(false);
      router.push("/");
      router.refresh();
    }
  }, [supabase, signingOut, router]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:fixed lg:inset-y-0 border-r border-border bg-surface z-40">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/pro/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold text-on-surface">Kelen</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-kelen-green-100 text-kelen-green-700">
              Pro
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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

        {/* Bottom: user info + sign out */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Notifications */}
          <div className="flex items-center gap-2">
            <NotificationDropdown />
          </div>

          {/* User */}
          <div className="rounded-lg bg-surface-container/50 p-3">
            <p className="text-xs font-medium text-on-surface truncate">{businessName}</p>
            <p className="mt-0.5 text-[10px] text-on-surface-variant truncate">{userEmail ?? "Chargement..."}</p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogOut className={`w-4 h-4 ${signingOut ? 'animate-pulse' : ''}`} />
            {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
          </button>
        </div>
      </aside>

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
              {NAV_ITEMS.map((item) => {
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
