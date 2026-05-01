import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Award, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Ma Visibilité — Kelen Pro",
};

const sections = [
  {
    href: "/pro/portfolio",
    icon: LayoutGrid,
    title: "Portfolio",
    description: "Présentez vos créations et projets passés à vos clients potentiels.",
  },
  {
    href: "/pro/realisations",
    icon: Award,
    title: "Présentation",
    description: "Vos réalisations, services et produits mis en avant sur Kelen.",
  },
  {
    href: "/pro/site",
    icon: Globe,
    title: "Mon Site",
    description: "Configurez et personnalisez votre site vitrine professionnel.",
  },
];

export default async function VisibilitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ma Visibilité</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre présence en ligne et votre portfolio professionnel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-surface-container-low p-5 hover:border-kelen-green-300 hover:shadow-sm transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kelen-green-50">
              <Icon className="h-5 w-5 text-kelen-green-700" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <p className="mt-auto text-xs font-semibold text-kelen-green-600 group-hover:text-kelen-green-700">
              Accéder →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
