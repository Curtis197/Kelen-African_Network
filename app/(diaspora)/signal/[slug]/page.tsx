import type { Metadata } from "next";
import Link from "next/link";
import { SignalForm } from "@/components/forms/SignalForm";

// Demo data
const DEMO_PRO = {
  id: "demo-1",
  slug: "kouadio-construction-abidjan",
  business_name: "Kouadio Construction",
  category: "Construction",
  city: "Abidjan",
  country: "Côte d'Ivoire",
};

interface SignalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SignalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pro = slug === DEMO_PRO.slug ? DEMO_PRO : null;
  return {
    title: pro
      ? `Signaler ${pro.business_name} — Kelen`
      : "Professionnel non trouvé — Kelen",
  };
}

export default async function SignalPage({ params }: SignalPageProps) {
  const { slug } = await params;
  const pro = slug === DEMO_PRO.slug ? DEMO_PRO : null;

  if (!pro) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Professionnel non trouvé
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ce professionnel n&apos;est pas référencé sur Kelen.
        </p>
        <Link
          href="/signal"
          className="mt-4 inline-block text-sm text-kelen-green-600 hover:text-kelen-green-700"
        >
          ← Retour à la sélection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/signal"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour
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

      <div className="rounded-xl border border-border bg-white p-6">
        <SignalForm
          professionalId={pro.id}
          professionalName={pro.business_name}
        />
      </div>
    </div>
  );
}
