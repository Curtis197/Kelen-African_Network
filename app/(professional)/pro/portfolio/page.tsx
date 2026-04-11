import type { Metadata } from "next";
import Link from "next/link";
import { Plus, LayoutGrid, List, FileText, MapPin, Calendar, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { deleteRealization } from "@/lib/actions/portfolio";

export const metadata: Metadata = {
  title: "Mon Portfolio — Kelen Pro",
  description: "Gérez les réalisations affichées sur votre profil public Kelen.",
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
    .select("id, business_name, slug")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return (
      <EmptyState
        title="Profil professionnel non trouvé"
        description="Veuillez d'abord compléter votre profil pour gérer votre portfolio."
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
      *,
      images:realization_images(*),
      documents:realization_documents(*)
    `)
    .eq("professional_id", professional.id)
    .order("completion_date", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
            Mon Portfolio
          </h1>
          <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
            Réalisations affichées sur votre profil public. Ce que les visiteurs voient.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/professionnels/${professional.slug}`}
            target="_blank"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-kelen-green-600 px-6 font-headline text-sm font-bold text-kelen-green-600 transition-all hover:bg-kelen-green-50"
          >
            Voir mon profil public
          </Link>
          <Link
            href="/pro/portfolio/add"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-6 font-headline text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-4px_rgba(0,150,57,0.3)] active:scale-95"
          >
            <Plus size={18} />
            <span>Nouvelle réalisation</span>
          </Link>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm font-medium text-on-surface-variant">
          <span>{realizations?.length || 0} réalisation{(realizations?.length || 0) > 1 ? "s" : ""} au total</span>
        </div>
      </div>

      {realizations && realizations.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {realizations.map((r) => (
            <RealizationCard key={r.id} realization={r} professionalSlug={professional.slug} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-[2rem]">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container-lowest text-on-surface-variant/20 shadow-sm">
            <LayoutGrid size={40} strokeWidth={1} />
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">Votre portfolio est vide</h2>
          <p className="mt-2 text-on-surface-variant/70 text-center max-w-sm">
            Ajoutez votre première réalisation pour montrer votre savoir-faire aux visiteurs de votre profil public.
          </p>
          <Link
            href="/pro/portfolio/add"
            className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-kelen-green-50 px-6 font-headline text-sm font-bold text-kelen-green-700 transition-all hover:bg-kelen-green-100"
          >
            Ajouter ma première réalisation
          </Link>
        </div>
      )}
    </div>
  );
}

async function RealizationCard({
  realization,
  professionalSlug,
}: {
  realization: any;
  professionalSlug: string;
}) {
  const mainImage =
    realization.images?.find((img: any) => img.is_main)?.url ||
    realization.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&q=80";

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl">
      <Link href={`/pro/portfolio/${realization.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src={mainImage}
            alt={realization.title}
          />
          {realization.documents && realization.documents.length > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
              <FileText size={12} />
              {realization.documents.length}
            </div>
          )}
        </div>
      </Link>

      <div className="p-6">
        <Link href={`/pro/portfolio/${realization.id}`}>
          <h3 className="text-lg font-headline font-bold text-on-surface mb-2 group-hover:text-kelen-green-600 transition-colors">
            {realization.title}
          </h3>
        </Link>

        {realization.description && (
          <p className="text-sm text-on-surface-variant/70 line-clamp-2 mb-4">{realization.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant/60">
          {realization.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {realization.location}
            </span>
          )}
          {realization.completion_date && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(realization.completion_date).toLocaleDateString("fr-FR", {
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {realization.price && (
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: realization.currency || "XOF",
                maximumFractionDigits: 0,
              }).format(realization.price)}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant/50">
            {realization.images?.length || 0} photo{(realization.images?.length || 0) !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/pro/portfolio/${realization.id}/edit`}
              className="text-xs font-bold text-kelen-green-600 hover:text-kelen-green-700 transition-colors"
            >
              Modifier
            </Link>
            <form action={async () => {
              "use server";
              await deleteRealization(realization.id);
            }}>
              <button
                type="submit"
                className="text-xs font-bold text-kelen-red-500 hover:text-kelen-red-600 transition-colors"
                onClick={(e) => {
                  if (!confirm("Supprimer cette réalisation ? Elle sera retirée de votre profil public.")) {
                    e.preventDefault();
                  }
                }}
              >
                Supprimer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
