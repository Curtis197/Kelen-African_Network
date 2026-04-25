import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { PresentationTabs } from "@/components/pro/PresentationTabs";
import { getServices } from "@/lib/actions/services";
import { getProducts } from "@/lib/actions/products";
import { CataloguePDFButton } from "@/components/pro/CataloguePDFButton";

export const metadata: Metadata = {
  title: "Présentation — Kelen Pro",
  description: "Gérez vos réalisations, services et produits sur Kelen.",
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProRealisationsPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab =
    tab === "services" || tab === "produits" ? tab : "realisations";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">
          Session expirée. Veuillez vous reconnecter.
        </p>
      </div>
    );
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, business_name, slug")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return (
      <EmptyState
        title="Profil professionnel non trouvé"
        description="Veuillez d'abord compléter votre profil pour gérer votre présentation."
        action={
          <Link
            href="/pro/profil"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-kelen-green-600 px-6 font-medium text-white transition-all hover:bg-kelen-green-700"
          >
            Compléter mon profil
          </Link>
        }
      />
    );
  }

  const [
    { data: realizations },
    services,
    products,
  ] = await Promise.all([
    supabase
      .from("professional_realizations")
      .select("*, images:realization_images(*), documents:realization_documents(*)")
      .eq("professional_id", professional.id)
      .order("completion_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(10),
    getServices(professional.id),
    getProducts(professional.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
            Ma présentation
          </h1>
          <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
            Gérez vos réalisations, services et produits affichés sur votre profil public.
          </p>
        </div>
        <CataloguePDFButton professionalId={professional.id} />
      </div>

      <PresentationTabs
        professional={professional}
        activeTab={activeTab as "realisations" | "services" | "produits"}
        realizations={realizations ?? []}
        services={services ?? []}
        products={products ?? []}
      />
    </div>
  );
}
