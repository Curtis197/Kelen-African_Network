import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Mes Missions — Kelen Pro",
};

const sections = [
  {
    href: "/pro/projets",
    icon: Briefcase,
    title: "Projets",
    description: "Suivez vos projets en cours, gérez vos missions et votre pipeline client.",
  },
  {
    href: "/pro/documents",
    icon: FileText,
    title: "Documents",
    description: "Retrouvez tous vos contrats, devis et documents liés à vos missions.",
  },
];

export default async function MissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro/connexion");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-kelen-green-50 text-kelen-green-600 flex-shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Mes Missions</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Gérez vos projets actifs et vos documents professionnels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
