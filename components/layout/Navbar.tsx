"use client";

import { useState } from "react";
import Link from "next/link";
import { MARKETING_NAV } from "@/lib/utils/constants";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-kelen-green-500">
            Kelen
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-500"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/recherche"
            className="rounded-lg border border-kelen-green-500 px-4 py-2 text-sm font-medium text-kelen-green-500 transition-colors hover:bg-kelen-green-50"
          >
            Vérifier un pro
          </Link>
          <Link
            href="/connexion"
            className="rounded-lg bg-kelen-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            Connexion
          </Link>
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
        <div className="border-t border-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-500"
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border" />
            <Link
              href="/recherche"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-kelen-green-500 px-4 py-2 text-center text-sm font-medium text-kelen-green-500"
            >
              Vérifier un pro
            </Link>
            <Link
              href="/connexion"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-kelen-green-500 px-4 py-2 text-center text-sm font-medium text-white"
            >
              Connexion
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
