"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  User,
  Briefcase,
  Award,
  AlertTriangle,
  Gem,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/pro/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/pro/projets", label: "Mes projets", icon: Briefcase },
  { href: "/pro/profil", label: "Mon profil", icon: User },
  { href: "/pro/realisations", label: "Mes réalisations", icon: Award },
  { href: "/pro/recommandations", label: "Recommandations", icon: Award },
  { href: "/pro/signal", label: "Signaux", icon: AlertTriangle },
  { href: "/pro/abonnement", label: "Abonnement & Visibilité", icon: Gem },
  { href: "/pro/analytique", label: "Analytique", icon: BarChart3 },
];

export function ProSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("Pro");
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
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Focus trap
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      firstElement?.focus();

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      drawerRef.current.addEventListener("keydown", handleTabKey);
      return () => {
        drawerRef.current?.removeEventListener("keydown", handleTabKey);
      };
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
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 flex h-screen flex-col">
          {/* Brand */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/" className="text-xl font-bold text-foreground">
              Kelen
            </Link>
            <span className="ml-2 rounded bg-kelen-green-50 px-1.5 py-0.5 text-xs font-medium text-kelen-green-700">
              Pro
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-4">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-kelen-green-50 text-kelen-green-700"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="border-t border-border p-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-foreground">
                {businessName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {userEmail ?? "Chargement..."}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Link href="/pro/dashboard" className="text-lg font-bold text-foreground">
          Kelen <span className="text-kelen-green-600">Pro</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="fixed inset-y-0 right-0 w-72 bg-surface shadow-xl overflow-y-auto"
            tabIndex={-1}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <span className="text-lg font-bold text-foreground">Menu Pro</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-kelen-green-50 text-kelen-green-700"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{businessName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {userEmail ?? "Chargement..."}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
