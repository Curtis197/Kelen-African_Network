import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/utils/constants";

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <span className="text-2xl font-bold text-kelen-green-500">
              Kelen
            </span>
            <p className="mt-3 text-sm text-white/60">
              La confiance ne se promet pas.
              <br />
              Elle se documente.
            </p>
          </div>

          {/* Plateforme */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Plateforme
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.plateforme.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-kelen-green-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Légal
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-kelen-green-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              Contact
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.contact.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-kelen-green-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/40">
            © {new Date().getFullYear()} Kelen SAS. Tous droits réservés.
            <span className="mx-2">·</span>
            Kelen signifie « un » en bambara et dioula.
          </p>
        </div>
      </div>
    </footer>
  );
}
