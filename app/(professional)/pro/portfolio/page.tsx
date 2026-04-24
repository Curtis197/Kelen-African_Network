import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { PortfolioPDFBuilder } from "@/components/pro/PortfolioPDFBuilder";

export const metadata: Metadata = {
  title: "Mon Portfolio PDF — Kelen Pro",
  description: "Construisez et exportez votre portfolio PDF professionnel.",
};

export default async function PortfolioPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Session expirée. Veuillez vous reconnecter.</p>
      </div>
    );
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, business_name, slug, is_visible")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return (
      <EmptyState
        title="Profil professionnel non trouvé"
        description="Veuillez d'abord compléter votre profil pour accéder à votre portfolio PDF."
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

  // Fetch all content in parallel
  const [
    { data: realizationsRaw },
    { data: servicesRaw },
    { data: productsRaw },
    { data: portfolio },
  ] = await Promise.all([
    supabase
      .from("professional_realizations")
      .select("id, title, completion_date, is_pdf_included, images:realization_images(url, is_main)")
      .eq("professional_id", professional.id)
      .order("completion_date", { ascending: false }),

    supabase
      .from("professional_services")
      .select("id, title, price, is_pdf_included")
      .eq("professional_id", professional.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("professional_products")
      .select("id, title, price, is_pdf_included")
      .eq("professional_id", professional.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("professional_portfolio")
      .select("cover_title, hero_image_url, hero_subtitle, about_text, about_image_url")
      .eq("professional_id", professional.id)
      .maybeSingle(),
  ]);

  // Normalise realizations: attach mainImage
  const realizations = (realizationsRaw ?? []).map((r: any) => ({
    id: r.id as string,
    title: r.title as string,
    completion_date: r.completion_date as string | null,
    is_pdf_included: r.is_pdf_included as boolean,
    mainImage: ((r.images ?? []) as { url: string; is_main: boolean }[])
      .find(i => i.is_main)?.url ?? (r.images as any[])?.[0]?.url ?? null,
  }));

  const services = (servicesRaw ?? []).map((s: any) => ({
    id: s.id as string,
    title: s.title as string,
    price: s.price ? String(s.price) : null,
    is_pdf_included: s.is_pdf_included as boolean,
  }));

  const products = (productsRaw ?? []).map((p: any) => ({
    id: p.id as string,
    title: p.title as string,
    price: p.price ? String(p.price) : null,
    is_pdf_included: p.is_pdf_included as boolean,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
            Mon Portfolio PDF
          </h1>
          <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
            Configurez la couverture, la page à propos et sélectionnez les éléments à inclure dans votre PDF.
          </p>
        </div>
        <Link
          href="/pro/portfolio/add"
          className="shrink-0 flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-5 font-headline text-sm font-bold text-white shadow-[0_6px_12px_-3px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Plus size={16} />
          Nouvelle réalisation
        </Link>
      </div>

      {/* Builder */}
      <PortfolioPDFBuilder
        professional={{ id: professional.id, slug: professional.slug, businessName: professional.business_name }}
        portfolio={portfolio}
        realizations={realizations}
        services={services}
        products={products}
      />
    </div>
  );
}
