"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MARKETING_NAV } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) setUserRole(profile.role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    };
    
    fetchUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) setUserRole(profile.role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    router.push("/");
    router.refresh();
  };

  const isPro = userRole?.startsWith("pro_") || userRole === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black tracking-tighter text-kelen-green-500 group-hover:scale-105 transition-transform duration-200">
            Kelen
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-kelen-green-600"
            >
              {item.label}
            </Link>
          ))}
          
          {/* Pro/Client conditional links */}
          {user && (
            <>
              <div className="h-4 w-[1px] bg-border mx-2" />
              <Link
                href="/projets"
                className="text-sm font-semibold text-foreground hover:text-kelen-green-600 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                Gestion de projets
              </Link>
              {isPro && (
                <Link
                  href="/pro/dashboard"
                  className="text-sm font-semibold text-foreground hover:text-kelen-green-600 transition-colors flex items-center gap-1.5"
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
          {!user && (
            <Link
              href="/recherche"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              Vérifier un pro
            </Link>
          )}

          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Déconnexion
            </button>
          ) : (
            <Link
              href="/connexion"
              className="flex items-center gap-2 rounded-xl bg-kelen-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-kelen-green-500/20 transition-all hover:bg-kelen-green-600 hover:shadow-xl active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Connexion
            </Link>
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
        <div className="border-t border-border bg-white px-4 py-6 md:hidden">
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
                <hr className="border-border my-2" />
                <Link
                  href="/projets"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-base font-bold text-foreground"
                >
                  <span className="material-symbols-outlined">account_tree</span>
                  Gestion de projets
                </Link>
                {isPro && (
                  <Link
                    href="/pro/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-base font-bold text-foreground"
                  >
                    <span className="material-symbols-outlined">dashboard</span>
                    Tableau de bord
                  </Link>
                )}
              </>
            )}

            <hr className="border-border my-2" />
            
            {user ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-base font-bold text-stone-600 transition-all hover:bg-stone-50"
              >
                <span className="material-symbols-outlined">logout</span>
                Déconnexion
              </button>
            ) : (
              <Link
                href="/connexion"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-kelen-green-500 py-3 text-base font-bold text-white shadow-lg"
              >
                <span className="material-symbols-outlined">login</span>
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
