"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Briefcase,
  Award,
  ShieldCheck,
  Gem,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
} from "lucide-react";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV_ITEMS = [
  { href: "/pro/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/pro/projets", label: "Projets", icon: Briefcase },
  { href: "/pro/realisations", label: "Réalisations", icon: Award },
  { href: "/pro/validation", label: "Validation", icon: ShieldCheck },
  { href: "/pro/abonnement", label: "Abonnement", icon: Gem },
  { href: "/pro/analytique", label: "Analytique", icon: BarChart3 },
];

export function ProSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("Mon profil");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        const { data: profile } = await supabase
          .from("professionals")
          .select("business_name")
          .eq("user_id", session.user.id)
          .single();
        if (profile?.business_name) {
          setBusinessName(profile.business_name);
        }
      }
    };
    getUser();
  }, [supabase.auth]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:fixed lg:inset-y-0 border-r border-border bg-surface dark:bg-surface z-40">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/pro/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold text-on-surface">Kelen</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-kelen-green-100 text-kelen-green-700 dark:bg-kelen-green-900/30 dark:text-kelen-green-400">
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
                    ? "bg-kelen-green-50 dark:bg-kelen-green-900/20 text-kelen-green-700 dark:text-kelen-green-400"
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
          {/* Notifications + Theme */}
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <ThemeToggle />
          </div>

          {/* User */}
          <div className="rounded-lg bg-surface-container/50 dark:bg-surface-container/50 p-3">
            <p className="text-xs font-medium text-on-surface truncate">{businessName}</p>
            <p className="mt-0.5 text-[10px] text-on-surface-variant truncate">{userEmail ?? "Chargement..."}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/pro/dashboard" className="flex items-center gap-2">
            <span className="text-base font-bold text-on-surface">Kelen</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-kelen-green-100 text-kelen-green-700 dark:bg-kelen-green-900/30 dark:text-kelen-green-400">
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
            className="fixed inset-y-0 right-0 w-72 bg-surface dark:bg-surface shadow-xl overflow-y-auto border-l border-border"
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
                        ? "bg-kelen-green-50 dark:bg-kelen-green-900/20 text-kelen-green-700 dark:text-kelen-green-400"
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Thème</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
