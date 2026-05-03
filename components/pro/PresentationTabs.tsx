"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Package,
  Plus,
  LayoutGrid,
  Eye,
  EyeOff,
} from "lucide-react";
import { ToggleFeaturedButton } from "@/components/pro/ToggleFeaturedButton";
import { DeleteButton } from "@/components/pro/DeleteButton";
import { toggleServiceFeatured, deleteService } from "@/lib/actions/services";
import { toggleProductFeatured, deleteProduct } from "@/lib/actions/products";
import { getProfessionalRealizations } from "@/lib/actions/portfolio";
import { useState } from "react";

// ─── Inline toggle for services ────────────────────────────────────────────

function ToggleServiceFeaturedButton({
  serviceId,
  isFeatured,
}: {
  serviceId: string;
  isFeatured: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleServiceFeatured(serviceId, !isFeatured);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isFeatured ? "Retirer du portfolio" : "Afficher dans le portfolio"}
      aria-label={isFeatured ? "Retirer du portfolio" : "Afficher dans le portfolio"}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
        isFeatured
          ? "text-kelen-green-600 bg-kelen-green-50 hover:bg-kelen-green-100"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
      }`}
    >
      {isFeatured ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
}

// ─── Inline delete for services ────────────────────────────────────────────

function DeleteServiceButton({ serviceId }: { serviceId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    toast("Supprimer ce service ?", {
      description: "Il sera retiré de votre profil public.",
      action: { label: "Supprimer", onClick: () => startTransition(() => deleteService(serviceId)) },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs font-bold text-kelen-red-500 hover:text-kelen-red-600 transition-colors disabled:opacity-40"
    >
      {isPending ? "..." : "Supprimer"}
    </button>
  );
}

// ─── Inline toggle for products ────────────────────────────────────────────

function ToggleProductFeaturedButton({
  productId,
  isFeatured,
}: {
  productId: string;
  isFeatured: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleProductFeatured(productId, !isFeatured);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={isFeatured ? "Retirer du portfolio" : "Afficher dans le portfolio"}
      aria-label={isFeatured ? "Retirer du portfolio" : "Afficher dans le portfolio"}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
        isFeatured
          ? "text-kelen-green-600 bg-kelen-green-50 hover:bg-kelen-green-100"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
      }`}
    >
      {isFeatured ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
}

// ─── Inline delete for products ────────────────────────────────────────────

function DeleteProductButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    toast("Supprimer ce produit ?", {
      description: "Il sera retiré de votre profil public.",
      action: {
        label: "Supprimer",
        onClick: () =>
          startTransition(async () => {
            await deleteProduct(productId);
          }),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs font-bold text-kelen-red-500 hover:text-kelen-red-600 transition-colors disabled:opacity-40"
    >
      {isPending ? "..." : "Supprimer"}
    </button>
  );
}

// ─── Availability badge helper ──────────────────────────────────────────────

function AvailabilityBadge({ availability }: { availability?: string | null }) {
  if (!availability) return null;

  const map: Record<string, { label: string; className: string }> = {
    available:      { label: "Disponible",    className: "bg-green-100 text-green-700" },
    limited_stock:  { label: "Stock limité",  className: "bg-yellow-100 text-yellow-700" },
    out_of_stock:   { label: "Rupture",       className: "bg-red-100 text-red-600" },
  };

  const config = map[availability] ?? { label: availability, className: "bg-surface-container text-on-surface-variant" };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${config.className}`}>
      {config.label}
    </span>
  );
}

// ─── Tab definitions ────────────────────────────────────────────────────────

const TABS = [
  { id: "realisations" as const, label: "Réalisations" },
  { id: "services"     as const, label: "Services"     },
  { id: "produits"     as const, label: "Produits"     },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  professional: { id: string; slug: string; business_name: string };
  activeTab: "realisations" | "services" | "produits";
  realizations: any[];
  services: any[];
  products: any[];
}

// ─── Main component ─────────────────────────────────────────────────────────

export function PresentationTabs({
  professional,
  activeTab,
  realizations,
  services,
  products,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [localRealizations, setLocalRealizations] = useState(realizations);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(realizations.length === 10); // Initial load is 10 in page.tsx now? No, need to check page.tsx
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  async function handleLoadMore() {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const offset = nextPage * PAGE_SIZE;
    
    const more = await getProfessionalRealizations(professional.id, PAGE_SIZE, offset);
    
    setLocalRealizations(prev => [...prev, ...more]);
    setPage(nextPage);
    setHasMore(more.length === PAGE_SIZE);
    setIsLoadingMore(false);
  }

  function handleTabClick(tabId: string) {
    router.push(`${pathname}?tab=${tabId}`);
  }

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl bg-surface-container-low border border-outline-variant/20">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`flex-1 flex items-center justify-center h-10 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeTab === id
                ? "bg-white shadow-sm text-on-surface"
                : "text-on-surface-variant/60 hover:text-on-surface hover:bg-white/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "realisations" && (
        <RealisationsTab 
          realizations={localRealizations} 
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
        />
      )}
      {activeTab === "services" && (
        <ServicesTab services={services} />
      )}
      {activeTab === "produits" && (
        <ProduitsTab products={products} />
      )}
    </div>
  );
}

// ─── Réalisations tab ───────────────────────────────────────────────────────

function RealisationsTab({ 
  realizations,
  hasMore,
  isLoadingMore,
  onLoadMore
}: { 
  realizations: any[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-end">
        <Link
          href="/pro/portfolio/add"
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-5 text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-4px_rgba(0,150,57,0.3)] active:scale-95"
        >
          <Plus size={16} />
          Nouvelle réalisation
        </Link>
      </div>

      {realizations.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={40} strokeWidth={1} />}
          title="Aucune réalisation"
          description="Ajoutez votre première réalisation pour mettre en avant vos compétences."
          actionHref="/pro/portfolio/add"
          actionLabel="Ajouter une réalisation"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {realizations.map((r) => {
            const mainImage =
              r.images?.find((img: any) => img.is_main)?.url ||
              r.images?.[0]?.url ||
              null;

            return (
              <div
                key={r.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl"
              >
                <Link href={`/pro/portfolio/${r.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                    {mainImage ? (
                      <Image
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        src={mainImage}
                        alt={r.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-on-surface-variant/20">
                        <LayoutGrid size={40} strokeWidth={1} />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-6">
                  <Link href={`/pro/portfolio/${r.id}`}>
                    <h3 className="text-lg font-headline font-bold text-on-surface mb-2 group-hover:text-kelen-green-600 transition-colors">
                      {r.title}
                    </h3>
                  </Link>

                  {r.description && (
                    <p className="text-sm text-on-surface-variant/70 line-clamp-2 mb-4">
                      {r.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant/60">
                    {r.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {r.location}
                      </span>
                    )}
                    {r.completion_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(r.completion_date).toLocaleDateString("fr-FR", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {r.price && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: r.currency || "XOF",
                          maximumFractionDigits: 0,
                        }).format(r.price)}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant/50">
                      {r.images?.length || 0} photo
                      {(r.images?.length || 0) !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <ToggleFeaturedButton
                        realizationId={r.id}
                        isFeatured={r.is_featured ?? false}
                      />
                      <Link
                        href={`/pro/portfolio/${r.id}/edit`}
                        className="text-xs font-bold text-kelen-green-600 hover:text-kelen-green-700 transition-colors"
                      >
                        Modifier
                      </Link>
                      <DeleteButton realizationId={r.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-10 py-4 rounded-2xl bg-surface-container hover:bg-surface-container-high text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
          >
            {isLoadingMore ? "Chargement..." : "Afficher plus de réalisations"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Services tab ───────────────────────────────────────────────────────────

function ServicesTab({ services }: { services: any[] }) {
  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-end">
        <Link
          href="/pro/realisations/services/add"
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-5 text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-4px_rgba(0,150,57,0.3)] active:scale-95"
        >
          <Plus size={16} />
          Nouveau service
        </Link>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={40} strokeWidth={1} />}
          title="Aucun service"
          description="Ajoutez vos services professionnels pour les afficher sur votre portfolio."
          actionHref="/pro/realisations/services/add"
          actionLabel="Ajouter un service"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {services.map((s) => {
            const mainImage =
              s.service_images?.find((img: any) => img.is_main)?.url ||
              s.service_images?.[0]?.url ||
              null;

            return (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  {mainImage ? (
                    <Image
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      src={mainImage}
                      alt={s.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-on-surface-variant/20">
                      <Briefcase size={40} strokeWidth={1} />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-headline font-bold text-on-surface mb-2 group-hover:text-kelen-green-600 transition-colors">
                    {s.title}
                  </h3>

                  {s.description && (
                    <p className="text-sm text-on-surface-variant/70 line-clamp-2 mb-4">
                      {s.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant/60">
                    {s.price && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: s.currency || "XOF",
                          maximumFractionDigits: 0,
                        }).format(s.price)}
                      </span>
                    )}
                    {s.duration && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {s.duration}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <ToggleServiceFeaturedButton
                      serviceId={s.id}
                      isFeatured={s.is_featured ?? false}
                    />
                    <Link
                      href={`/pro/realisations/services/${s.id}/edit`}
                      className="text-xs font-bold text-kelen-green-600 hover:text-kelen-green-700 transition-colors"
                    >
                      Modifier
                    </Link>
                    <DeleteServiceButton serviceId={s.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Produits tab ───────────────────────────────────────────────────────────

function ProduitsTab({ products }: { products: any[] }) {
  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-end">
        <Link
          href="/pro/realisations/produits/add"
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-5 text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-4px_rgba(0,150,57,0.3)] active:scale-95"
        >
          <Plus size={16} />
          Nouveau produit
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={40} strokeWidth={1} />}
          title="Aucun produit"
          description="Ajoutez vos produits pour les afficher sur votre portfolio."
          actionHref="/pro/realisations/produits/add"
          actionLabel="Ajouter un produit"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {products.map((p) => {
            const mainImage =
              p.product_images?.find((img: any) => img.is_main)?.url ||
              p.product_images?.[0]?.url ||
              null;

            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  {mainImage ? (
                    <Image
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      src={mainImage}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-on-surface-variant/20">
                      <Package size={40} strokeWidth={1} />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-headline font-bold text-on-surface group-hover:text-kelen-green-600 transition-colors">
                      {p.title}
                    </h3>
                    <AvailabilityBadge availability={p.availability} />
                  </div>

                  {p.description && (
                    <p className="text-sm text-on-surface-variant/70 line-clamp-2 mb-4">
                      {p.description}
                    </p>
                  )}

                  {p.price && (
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant/60 mb-1">
                      <DollarSign size={12} />
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: p.currency || "XOF",
                        maximumFractionDigits: 0,
                      }).format(p.price)}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <ToggleProductFeaturedButton
                      productId={p.id}
                      isFeatured={p.is_featured ?? false}
                    />
                    <Link
                      href={`/pro/realisations/produits/${p.id}/edit`}
                      className="text-xs font-bold text-kelen-green-600 hover:text-kelen-green-700 transition-colors"
                    >
                      Modifier
                    </Link>
                    <DeleteProductButton productId={p.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shared empty state ─────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-[2rem]">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container-lowest text-on-surface-variant/20 shadow-sm">
        {icon}
      </div>
      <h2 className="font-headline text-xl font-bold text-on-surface">{title}</h2>
      <p className="mt-2 text-on-surface-variant/70 text-center max-w-sm">{description}</p>
      <Link
        href={actionHref}
        className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-kelen-green-50 px-6 font-headline text-sm font-bold text-kelen-green-700 transition-all hover:bg-kelen-green-100"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
