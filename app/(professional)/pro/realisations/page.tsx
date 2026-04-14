import type { Metadata } from "next";
import Link from "next/link";
import { Plus, LayoutGrid, FileText, MapPin, Calendar, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { deleteRealization } from "@/lib/actions/portfolio";
import { DeleteButton } from "@/components/pro/DeleteButton";
import { ToggleFeaturedButton } from "@/components/pro/ToggleFeaturedButton";

export const metadata: Metadata = {
  title: "Mes réalisations — Kelen Pro",
  description: "Gérez vos réalisations professionnelles terminées sur Kelen.",
};

export default async function ProRealisationsPage() {
  console.log("[ProRealisationsPage] Loading realizations page");
  const supabase = await createClient();

  // Auth check
  console.log("[ProRealisationsPage] Checking authentication...");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("[ProRealisationsPage] Auth result:", {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (authError) {
    console.error("[ProRealisationsPage] Auth error:", authError);
  }

  if (!user) {
    console.warn("[ProRealisationsPage] No user session - showing reconnect message");
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Session expirée. Veuillez vous reconnecter.</p>
      </div>
    );
  }

  console.log("[ProRealisationsPage] ✅ Authentication successful");

  // Fetch professional profile
  console.log("[ProRealisationsPage] Fetching professional profile...");
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id, business_name, slug")
    .eq("user_id", user.id)
    .single();

  console.log("[ProRealisationsPage] Professional query result:", {
    success: !profError,
    hasData: !!professional,
    professionalId: professional?.id,
    errorMessage: profError?.message,
    errorCode: profError?.code
  });

  if (profError) {
    if (profError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professionals table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', profError.message);
      console.error('[RLS] Fix: Check RLS policies on professionals table');
      console.error('[RLS] ========================================');
    } else {
      console.error("[ProRealisationsPage] Professional fetch error:", profError);
    }
  }

  if (!professional) {
    console.warn("[ProRealisationsPage] No professional profile found");
    return (
      <EmptyState
        title="Profil professionnel non trouvé"
        description="Veuillez d'abord compléter votre profil pour gérer vos réalisations."
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

  console.log("[ProRealisationsPage] ✅ Professional found:", professional.id, professional.business_name);

  // Fetch realizations from professional_realizations table (NOT project_documents)
  console.log("[ProRealisationsPage] Fetching realizations from professional_realizations...");
  const { data: realizations, error: realizationsError } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*),
      documents:realization_documents(*)
    `)
    .eq("professional_id", professional.id)
    .order("completion_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  console.log("[ProRealisationsPage] Realizations query result:", {
    success: !realizationsError,
    count: realizations?.length || 0,
    errorMessage: realizationsError?.message,
    errorCode: realizationsError?.code
  });

  if (realizationsError) {
    if (realizationsError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professional_realizations table');
      console.error('[RLS] ========================================');
      console.error('[RLS] Professional ID:', professional.id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', realizationsError.message);
      console.error('[RLS] Fix: Check RLS policies on professional_realizations table');
      console.error('[RLS] ========================================');
    } else {
      console.error("[ProRealisationsPage] Realizations fetch error:", realizationsError);
    }
  }

  if (!realizations || realizations.length === 0) {
    console.warn("[ProRealisationsPage] No realizations found - possible silent RLS filtering or empty table");
  } else {
    console.log("[ProRealisationsPage] ✅ Found", realizations.length, "realizations");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
            Mes réalisations
          </h1>
          <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
            Projets terminés affichés sur votre portfolio public. Gérez vos démonstrations de savoir-faire.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pro/portfolio"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-kelen-green-600 px-6 font-headline text-sm font-bold text-kelen-green-600 transition-all hover:bg-kelen-green-50"
          >
            Voir mon portfolio
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
           <span>{realizations?.length || 0} réalisation{(realizations?.length || 0) > 1 ? 's' : ''} au total</span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-on-surface shadow-sm transition-all" title="Grille">
            <LayoutGrid size={16} />
          </button>
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
          <h2 className="font-headline text-xl font-bold text-on-surface">C'est encore vide ici !</h2>
          <p className="mt-2 text-on-surface-variant/70 text-center max-w-sm">
            Commencez par ajouter votre première réalisation pour mettre en avant vos compétences auprès de la Diaspora.
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
  console.log("[RealizationCard] Rendering:", realization.id, realization.title);
  
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
            <ToggleFeaturedButton
              realizationId={realization.id}
              isFeatured={realization.is_featured ?? false}
            />
            <Link
              href={`/pro/portfolio/${realization.id}/edit`}
              className="text-xs font-bold text-kelen-green-600 hover:text-kelen-green-700 transition-colors"
            >
              Modifier
            </Link>
            <DeleteButton realizationId={realization.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
