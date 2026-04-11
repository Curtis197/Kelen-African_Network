import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, DollarSign, ImageIcon, Edit2 } from "lucide-react";
import { RealizationGallery } from "@/components/pro/RealizationGallery";
import type { ProjectDocument } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Détails de la réalisation — Kelen Pro",
};

interface RealizationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RealizationDetailPage({ params }: RealizationDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/pro/profil");

  const { data: document, error } = await supabase
    .from("project_documents")
    .select("*, images:project_images(*)")
    .eq("id", id)
    .eq("professional_id", professional.id)
    .single();

  if (!document) {
    console.error("[RealizationDetail] Document not found:", error);
    notFound();
  }

  const doc = document as ProjectDocument;

  const statusLabels: Record<string, string> = {
    pending_review: "En attente de vérification",
    published: "Publié",
    rejected: "Rejeté",
  };

  const statusColors: Record<string, string> = {
    pending_review: "bg-kelen-yellow-500/10 text-kelen-yellow-700",
    published: "bg-kelen-green-500/10 text-kelen-green-700",
    rejected: "bg-kelen-red-500/10 text-kelen-red-700",
  };

  const featuredPhoto = doc.images?.find(img => img.is_main)?.url || doc.images?.[0]?.url;
  const allPhotos = doc.images?.map(img => img.url) || [];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Featured Photo Hero */}
      {featuredPhoto && (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[2.5rem] bg-white shadow-sm mb-8">
          <Image
            src={featuredPhoto}
            alt={doc.project_title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <Link
          href="/pro/realisations"
          className="mb-4 flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux réalisations
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
              {doc.project_title}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusColors[doc.status]}`}>
                {statusLabels[doc.status]}
              </span>
              {allPhotos.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                  <ImageIcon size={12} />
                  {allPhotos.length} photo{allPhotos.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/pro/realisations/${doc.id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
            aria-label="Modifier"
          >
            <Edit2 size={16} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Image Gallery */}
        <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Photos du projet</h2>
          {allPhotos.length > 0 ? (
            <RealizationGallery
              photoUrls={allPhotos}
              projectTitle={doc.project_title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon size={48} className="mb-4 text-on-surface-variant/20" />
              <p className="text-on-surface-variant/50">Aucune photo disponible</p>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Détails du projet</h2>
          
          <div className="space-y-6">
            {doc.project_description && (
              <div>
                <h3 className="text-sm font-bold text-on-surface-variant mb-2">Description</h3>
                <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{doc.project_description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {doc.project_date && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="mt-0.5 text-kelen-yellow-700" />
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant mb-1">Date</h3>
                    <p className="text-on-surface">
                      {new Date(doc.project_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {doc.project_amount && (
                <div className="flex items-start gap-3">
                  <DollarSign size={18} className="mt-0.5 text-kelen-green-600" />
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant mb-1">Montant</h3>
                    <p className="text-on-surface">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(doc.project_amount)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
