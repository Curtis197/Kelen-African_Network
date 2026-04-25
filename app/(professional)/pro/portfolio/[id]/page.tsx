import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText, Download, Play, Video } from "lucide-react";
import { RealizationCopyCorrector } from "@/components/portfolio/RealizationCopyCorrector";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RealizationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: realization } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*),
      videos:realization_videos(*),
      documents:realization_documents(*)
    `)
    .eq("id", id)
    .single();

  if (!realization) notFound();

  const mainImage =
    realization.images?.find((img: any) => img.is_main)?.url ||
    realization.images?.[0]?.url;
  const galleryImages = realization.images
    ? realization.images.filter((img: any) => img.url !== mainImage).map((img: any) => img.url)
    : [];
  const videos: Array<{ id: string; url: string; thumbnail_url: string | null; duration: number | null }> =
    [...(realization.videos || [])].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <Link
          href="/pro/portfolio"
          className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Retour au portfolio
        </Link>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
          {realization.title}
        </h1>
      </div>

      {/* Main Image */}
      {mainImage && (
        <div className="rounded-2xl overflow-hidden mb-10 aspect-[21/9] relative">
          <Image
            src={mainImage}
            alt={realization.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Description & Gallery */}
        <div className="lg:col-span-2 space-y-10">
          {realization.description && (
            <section>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">Description</h2>
              <p className="text-on-surface-variant/80 leading-relaxed whitespace-pre-wrap">
                {realization.description}
              </p>
            </section>
          )}

          {galleryImages.length > 0 && (
            <section>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4">Galerie</h2>
              <div className="grid grid-cols-2 gap-4">
                {galleryImages.map((url: string, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden relative">
                    <Image
                      src={url}
                      alt={`${realization.title} - ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <Video size={18} className="text-kelen-green-600" />
                Vidéos
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {videos.map((video) => (
                  <div key={video.id} className="relative aspect-video overflow-hidden rounded-xl bg-stone-900">
                    {video.thumbnail_url ? (
                      <Image
                        src={video.thumbnail_url}
                        alt="Miniature vidéo"
                        fill
                        className="object-cover"
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
                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Play size={20} className="text-white ml-0.5" fill="currentColor" />
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
            </section>
          )}
        </div>

        {/* Right: Specs */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-surface-container-low p-6 space-y-6">
            <h3 className="font-headline font-bold text-on-surface">Spécifications</h3>

            {realization.location && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-kelen-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">Localisation</p>
                  <p className="text-sm font-medium text-on-surface">{realization.location}</p>
                </div>
              </div>
            )}

            {realization.completion_date && (
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-kelen-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium text-on-surface">
                    {new Date(realization.completion_date).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {realization.price && (
              <div className="flex items-start gap-3">
                <DollarSign size={16} className="text-kelen-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">Prix</p>
                  <p className="text-sm font-medium text-on-surface">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: realization.currency || "XOF",
                      maximumFractionDigits: 0,
                    }).format(realization.price)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          {realization.documents && realization.documents.length > 0 && (
            <div className="rounded-2xl bg-surface-container-low p-6 space-y-4">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <FileText size={16} className="text-kelen-green-600" />
                Documents
              </h3>
              {realization.documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-white p-3 hover:bg-surface-container transition-colors group"
                >
                  <FileText size={14} className="text-on-surface-variant/50 flex-shrink-0" />
                  <span className="text-sm text-on-surface truncate flex-1">
                    {doc.title || "Document"}
                  </span>
                  <Download size={14} className="text-on-surface-variant/30 group-hover:text-kelen-green-600 transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          )}

          <Link
            href={`/pro/portfolio/${realization.id}/edit`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-kelen-green-600 py-3 font-headline text-sm font-bold text-white hover:bg-kelen-green-700 transition-colors"
          >
            Modifier cette réalisation
          </Link>

          <RealizationCopyCorrector
            id={realization.id}
            title={realization.title}
            description={realization.description ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
