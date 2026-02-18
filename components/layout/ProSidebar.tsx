"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/pro/dashboard", label: "Tableau de bord", icon: "📊" },
  { href: "/pro/profil", label: "Mon profil", icon: "👤" },
  { href: "/pro/recommandations", label: "Recommandations", icon: "✓" },
  { href: "/pro/signal", label: "Signaux", icon: "⚠" },
  { href: "/pro/credit", label: "Crédits & Visibilité", icon: "💰" },
  { href: "/pro/analytique", label: "Analytique", icon: "📈" },
];

export function ProSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-white lg:block">
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
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-foreground">
              Kouadio Construction
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              contact@kouadio-construction.ci
            </p>
          </div>
          <button className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Se déconnecter
          </button>
        </div>
      </div>
    </aside>
  );
}
