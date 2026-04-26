"use client";

import { useState } from "react";
import Link from "next/link";
import { MARKETING_PRO_NAV } from "@/lib/utils/constants";
import { Menu, X } from "lucide-react";

export function NavbarMarketingPro() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo — links to pro landing, not homepage */}
        <Link href="/pour-les-professionnels" className="flex items-center gap-1 group">
          <span className="text-2xl font-black tracking-tighter text-kelen-green-500 group-hover:scale-105 transition-transform duration-200">
            Kelen
          </span>
          <span className="ml-1 rounded bg-kelen-green-100 px-1.5 py-0.5 text-[10px] font-bold text-kelen-green-700">
            Pro
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 md:flex">
          {MARKETING_PRO_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/pro/connexion"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
          >
            Se connecter
          </Link>
          <Link
            href="/pro/inscription"
            className="rounded-lg bg-kelen-green-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-kelen-green-600"
          >
            Créer mon profil →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 md:hidden rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {MARKETING_PRO_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border" />
            <Link
              href="/pro/connexion"
              onClick={() => setMobileOpen(false)}
              className="text-center py-3 text-sm font-medium text-foreground/70 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/pro/inscription"
              onClick={() => setMobileOpen(false)}
              className="text-center py-3 text-sm font-bold text-white bg-kelen-green-500 rounded-lg hover:bg-kelen-green-600 transition-colors"
            >
              Créer mon profil →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
