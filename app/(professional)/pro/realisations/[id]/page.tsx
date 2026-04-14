import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, DollarSign, ImageIcon, Edit2, MapPin, Play, Video } from "lucide-react";
import { RealizationGallery } from "@/components/pro/RealizationGallery";

export const metadata: Metadata = {
  title: "Détails de la réalisation — Kelen Pro",
};

interface RealizationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RealizationDetailPage({ params }: RealizationDetailPageProps) {
  console.log("[RealizationDetailPage] Loading realization:", (await params).id);
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  console.log("[RealizationDetailPage] Checking authentication...");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("[RealizationDetailPage] Auth result:", {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (authError) {
    console.error("[RealizationDetailPage] Auth error:", authError);
  }

  if (!user) {
    console.warn("[RealizationDetailPage] No user session - redirecting to login");
    redirect("/login");
  }

  console.log("[RealizationDetailPage] ✅ Authentication successful");

  // Fetch professional profile
  console.log("[RealizationDetailPage] Fetching professional profile...");
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  console.log("[RealizationDetailPage] Professional query result:", {
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
      console.error("[RealizationDetailPage] Professional fetch error:", profError);
    }
  }

  if (!professional) {
    console.warn("[RealizationDetailPage] No professional profile found - redirecting to profil");
    redirect("/pro/profil");
  }

  console.log("[RealizationDetailPage] ✅ Professional found:", professional.id);

  // Fetch realization from professional_realizations table (NOT project_documents)
  console.log("[RealizationDetailPage] Fetching realization from professional_realizations...");
  const { data: realization, error: realizationError } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*),
      videos:realization_videos(*),
      documents:realization_documents(*)
    `)
    .eq("id", id)
    .eq("professional_id", professional.id)
    .single();

  console.log("[RealizationDetailPage] Realization query result:", {
    success: !realizationError,
    hasData: !!realization,
    realizationId: realization?.id,
    title: realization?.title,
    errorMessage: realizationError?.message,
    errorCode: realizationError?.code
  });

  if (realizationError) {
    if (realizationError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professional_realizations table');
      console.error('[RLS] ========================================');
      console.error('[RLS] Realization ID:', id);
      console.error('[RLS] Professional ID:', professional.id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', realizationError.message);
      console.error('[RLS] Fix: Check RLS policies on professional_realizations table');
      console.error('[RLS] ========================================');
    } else {
      console.error("[RealizationDetailPage] Realization fetch error:", realizationError);
    }
    notFound();
  }

  if (!realization) {
    console.warn("[RealizationDetailPage] Realization not found");
    notFound();
  }

  console.log("[RealizationDetailPage] ✅ Realization found:", realization.title);

  const featuredPhoto = realization.images?.find((img: any) => img.is_main)?.url || realization.images?.[0]?.url;
  const allPhotos = realization.images?.map((img: any) => img.url) || [];
  const videos: Array<{ id: string; url: string; thumbnail_url: string | null; duration: number | null; order_index: number }> =
    [...(realization.videos || [])].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return (
    <div className="mx-auto max-w-5xl">
      {/* Featured Photo Hero */}
      {featuredPhoto && (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[2.5rem] bg-white shadow-sm mb-8">
          <Image
            src={featuredPhoto}
            alt={realization.title}
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
          href="/pro/portfolio"
          className="mb-4 flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={16} />
          Retour au portfolio
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
              {realization.title}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              {allPhotos.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                  <ImageIcon size={12} />
                  {allPhotos.length} photo{allPhotos.length > 1 ? 's' : ''}
                </span>
              )}
              {videos.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant">
                  <Video size={12} />
                  {videos.length} vidéo{videos.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/pro/portfolio/${realization.id}/edit`}
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
          <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Photos de la réalisation</h2>
          {allPhotos.length > 0 ? (
            <RealizationGallery
              photoUrls={allPhotos}
              projectTitle={realization.title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon size={48} className="mb-4 text-on-surface-variant/20" />
              <p className="text-on-surface-variant/50">Aucune photo disponible</p>
            </div>
          )}
        </div>

        {/* Videos Section */}
        {videos.length > 0 && (
          <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
            <h2 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <Video size={20} className="text-kelen-green-600" />
              Vidéos
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {videos.map((video) => (
                <div key={video.id} className="relative aspect-video overflow-hidden rounded-2xl bg-stone-900 group">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt="Miniature vidéo"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={video.url}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <Play size={24} className="text-white ml-1" fill="currentColor" />
                    </div>
                  </a>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
                      {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="rounded-[2.5rem] bg-white p-8 shadow-sm lg:p-12">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Détails de la réalisation</h2>

          <div className="space-y-6">
            {realization.description && (
              <div>
                <h3 className="text-sm font-bold text-on-surface-variant mb-2">Description</h3>
                <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{realization.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {realization.location && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 text-kelen-yellow-700" />
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant mb-1">Localisation</h3>
                    <p className="text-on-surface">{realization.location}</p>
                  </div>
                </div>
              )}

              {realization.completion_date && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="mt-0.5 text-kelen-green-600" />
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant mb-1">Date d'achèvement</h3>
                    <p className="text-on-surface">
                      {new Date(realization.completion_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {realization.price && (
                <div className="flex items-start gap-3">
                  <DollarSign size={18} className="mt-0.5 text-kelen-green-600" />
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant mb-1">Montant</h3>
                    <p className="text-on-surface">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: realization.currency || 'XOF' }).format(realization.price)}
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
