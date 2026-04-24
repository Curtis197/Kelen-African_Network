import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileDown, Eye, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { PortfolioPDFButton } from "@/components/pro/PortfolioPDFButton";

export const metadata: Metadata = {
  title: "Mon Portfolio PDF — Kelen Pro",
  description: "Générez et téléchargez votre portfolio en PDF pour le partager avec vos clients.",
};

export default async function PortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data: realizations } = await supabase
    .from("professional_realizations")
    .select(`
      id, title, description, completion_date, is_featured,
      images:realization_images(id, is_main, url)
    `)
    .eq("professional_id", professional.id)
    .order("completion_date", { ascending: false });

  const featured = realizations?.filter((r) => r.is_featured) ?? [];
  const total = realizations?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          Mon Portfolio PDF
        </h1>
        <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
          Générez votre portfolio en PDF pour le partager avec vos clients ou prospects.
        </p>
      </div>

      {/* Export card */}
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-kelen-green-600" />
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Exporter tout le portfolio
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant/70">
            {total} réalisation{total !== 1 ? "s" : ""} au total —{" "}
            <span className="font-medium text-kelen-green-600">
              {featured.length} dans le portfolio
            </span>
          </p>
        </div>
        <PortfolioPDFButton
          professionalId={professional.id}
          label="Télécharger le portfolio PDF"
        />
      </div>

      {/* Realizations list */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-kelen-green-600" />
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Réalisations
            </h2>
          </div>
          <Link
            href="/pro/portfolio/add"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-5 font-headline text-sm font-bold text-white shadow-[0_6px_12px_-3px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Plus size={16} />
            Nouvelle réalisation
          </Link>
        </div>
        <p className="text-sm text-on-surface-variant/60">
          Cochez les réalisations à inclure dans votre portfolio PDF via le bouton{" "}
          <span className="font-medium text-on-surface">Portfolio</span> sur chaque carte.
        </p>

        {realizations && realizations.length > 0 ? (
          <div className="space-y-3">
            {realizations.map((r) => {
              const mainImage =
                (r.images as any[])?.find((i) => i.is_main)?.url ??
                (r.images as any[])?.[0]?.url ??
                null;
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                    r.is_featured
                      ? "border-kelen-green-300 bg-kelen-green-50/40"
                      : "border-outline-variant/20 bg-surface"
                  }`}
                >
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={r.title}
                      className="h-14 w-20 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-20 rounded-lg bg-surface-container shrink-0 flex items-center justify-center text-on-surface-variant/20">
                      <LayoutGrid size={20} strokeWidth={1} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-on-surface truncate">{r.title}</p>
                    {r.completion_date && (
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">
                        {new Date(r.completion_date).toLocaleDateString("fr-FR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.is_featured && (
                      <span className="flex items-center gap-1 rounded-full bg-kelen-green-600 px-2.5 py-1 text-xs font-bold text-white">
                        <Eye size={10} />
                        Portfolio
                      </span>
                    )}
                    <PortfolioPDFButton realizationId={r.id} variant="icon" />
                    <Link
                      href={`/pro/portfolio/${r.id}/edit`}
                      className="text-xs font-bold text-kelen-green-600 hover:text-kelen-green-700 transition-colors"
                    >
                      Modifier
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-[2rem]">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container-lowest text-on-surface-variant/20 shadow-sm">
              <LayoutGrid size={40} strokeWidth={1} />
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Aucune réalisation
            </h2>
            <p className="mt-2 text-on-surface-variant/70 text-center max-w-sm">
              Ajoutez vos premières réalisations pour les inclure dans votre portfolio PDF.
            </p>
            <Link
              href="/pro/portfolio/add"
              className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-kelen-green-50 px-6 font-headline text-sm font-bold text-kelen-green-700 transition-all hover:bg-kelen-green-100"
            >
              Ajouter ma première réalisation
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
