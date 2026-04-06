"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  User,
  Briefcase,
  Award,
  AlertTriangle,
  Gem,
  BarChart3,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/pro/dashboard", label: "Tableau de bord", mobileLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/pro/profil", label: "Mon profil", mobileLabel: "Profil", icon: User },
  { href: "/pro/realisations", label: "Mes réalisations", mobileLabel: "Projets", icon: Briefcase },
  { href: "/pro/recommandations", label: "Recommandations", mobileLabel: "Recomm.", icon: Award },
  { href: "/pro/signal", label: "Signaux", mobileLabel: "Signaux", icon: AlertTriangle },
  { href: "/pro/abonnement", label: "Abonnement & Visibilité", mobileLabel: "Abo.", icon: Gem },
  { href: "/pro/analytique", label: "Analytique", mobileLabel: "Stats", icon: BarChart3 },
];

const MOBILE_NAV_ITEMS = [
  { href: "/pro/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pro/profil", label: "Profil", icon: User },
  { href: "/pro/realisations", label: "Projets", icon: Briefcase },
  { href: "/pro/recommandations", label: "Recomm.", icon: Award },
  { href: "/pro/abonnement", label: "Abo.", icon: Gem },
];

export function ProSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("Pro");

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

      {/* Mobile bottom navigation - max 5 items */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-3 transition-colors ${
                  isActive ? "text-kelen-green-600" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-bold leading-tight text-center max-w-[56px] truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
