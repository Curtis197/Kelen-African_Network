import type { Metadata } from "next";
import Link from "next/link";
import { SignalForm } from "@/components/forms/SignalForm";
import { createClient } from "@/lib/supabase/server";

interface SignalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SignalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name")
    .eq("slug", slug)
    .single();

  return {
    title: pro
      ? `Signaler ${pro.business_name} — Kelen`
      : "Professionnel non trouvé — Kelen",
  };
}

export default async function SignalPage({ params }: SignalPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("id, business_name, category, city, country, slug")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center px-4">
        <h1 className="text-2xl font-bold text-foreground">
          Professionnel non trouvé
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ce professionnel n&apos;est pas référencé sur Kelen.
        </p>
        <Link
          href="/recherche"
          className="mt-4 inline-block text-sm text-kelen-green-600 hover:text-kelen-green-700"
        >
          ← Retour à la recherche
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/pro/${pro.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        ← Retour au profil
      </Link>

      <div className="mt-4 mb-6 rounded-xl border border-kelen-red-500/20 bg-kelen-red-50/30 p-4">
        <p className="text-sm text-muted-foreground">Signal concernant</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {pro.business_name}
        </p>
        <p className="text-sm text-muted-foreground">
          {pro.category} · {pro.city}, {pro.country}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <SignalForm
          professionalId={pro.id}
          professionalName={pro.business_name}
          professionalSlug={pro.slug}
        />
      </div>
    </div>
  );
}
