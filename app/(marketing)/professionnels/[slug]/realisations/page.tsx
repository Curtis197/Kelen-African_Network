import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Heart, MessageCircle, Play } from "lucide-react";
import Link from "next/link";
import PriceDisplay from "@/components/projects/PriceDisplay";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

type MediaItem =
  | { type: "image"; url: string }
  | { type: "video"; url: string; thumbnail_url?: string | null };

function MediaContent({ item }: { item: MediaItem }) {
  if (item.type === "image") {
    return (
      <img
        src={item.url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
    );
  }
  if (item.thumbnail_url) {
    return (
      <>
        <img
          src={item.thumbnail_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white" fill="currentColor" />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <video
        src={item.url}
        preload="metadata"
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-5 h-5 text-white" fill="currentColor" />
        </div>
      </div>
    </>
  );
}

function MediaGrid({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="aspect-[4/3] relative overflow-hidden">
        <MediaContent item={items[0]} />
      </div>
    );
  }

  if (items.length === 2) {
    return (
      <div className="aspect-[4/3] grid grid-cols-2 gap-0.5 overflow-hidden">
        <div className="relative overflow-hidden">
          <MediaContent item={items[0]} />
        </div>
        <div className="relative overflow-hidden">
          <MediaContent item={items[1]} />
        </div>
      </div>
    );
  }

  // 3+ items: large left spanning full height + 2 stacked on right
  const overflow = items.length - 3;
  return (
    <div className="aspect-[4/3] grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden">
      <div className="relative overflow-hidden row-span-2">
        <MediaContent item={items[0]} />
      </div>
      <div className="relative overflow-hidden">
        <MediaContent item={items[1]} />
      </div>
      <div className="relative overflow-hidden">
        <MediaContent item={items[2]} />
        {overflow > 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">+{overflow}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("business_name")
    .eq("slug", slug)
    .single();

  if (!pro) return { title: "Professionnel non trouvé | Kelen" };

  return {
    title: `Réalisations de ${pro.business_name} | Kelen`,
    description: `Découvrez toutes les réalisations de ${pro.business_name} sur Kelen.`,
  };
}

export default async function RealisationsListPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!pro) notFound();

  // Fetch realizations with their images and videos
  const { data: realizations } = await supabase
    .from("professional_realizations")
    .select(`
      *,
      images:realization_images(*),
      videos:realization_videos(*)
    `)
    .eq("professional_id", pro.id)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  // Fetch like and comment counts for each realization
  const realizationIds = realizations?.map(r => r.id) || [];
  const likesData = realizationIds.length > 0 ? await Promise.all(
    realizationIds.map(async (id) => {
      const { count } = await supabase
        .from("realization_likes")
        .select("*", { count: "exact", head: true })
        .eq("realization_id", id);
      return { id, count: count || 0 };
    })
  ) : [];

  const commentsData = realizationIds.length > 0 ? await Promise.all(
    realizationIds.map(async (id) => {
      const { count } = await supabase
        .from("realization_comments")
        .select("*", { count: "exact", head: true })
        .eq("realization_id", id)
        .eq("status", "approved");
      return { id, count: count || 0 };
    })
  ) : [];

  const likesMap = Object.fromEntries(likesData.map(l => [l.id, l.count]));
  const commentsMap = Object.fromEntries(commentsData.map(c => [c.id, c.count]));

  const fallbackImage = "https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&q=80";

  const portfolioItems = realizations && realizations.length > 0
    ? realizations.map(r => {
        // Build ordered image list with main image first
        const rawImages: any[] = r.images || [];
        const mainIdx = rawImages.findIndex((img: any) => img.is_main);
        const orderedImages = mainIdx > 0
          ? [rawImages[mainIdx], ...rawImages.filter((_: any, i: number) => i !== mainIdx)]
          : rawImages;

        const imageItems: MediaItem[] = orderedImages.map((img: any) => ({
          type: "image",
          url: img.url,
        }));

        const videoItems: MediaItem[] = [...(r.videos || [])]
          .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((v: any) => ({
            type: "video",
            url: v.url,
            thumbnail_url: v.thumbnail_url ?? null,
          }));

        const mediaItems: MediaItem[] =
          imageItems.length > 0 || videoItems.length > 0
            ? [...imageItems, ...videoItems]
            : [{ type: "image", url: fallbackImage }];

        return {
          id: r.id,
          title: r.title,
          description: r.description || "",
          mediaItems,
          location: r.location,
          price: r.price,
          currency: r.currency || "XOF",
          likeCount: likesMap[r.id] || 0,
          commentCount: commentsMap[r.id] || 0,
        };
      })
    : [];

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <main className="pt-8">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
          <Link
            href={`/professionnels/${slug}#portfolio`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </Link>
        </div>

        {/* Grid */}
        <section className="py-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            {portfolioItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {portfolioItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/professionnels/${slug}/realisations/${item.id}`}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:shadow-2xl"
                  >
                    <MediaGrid items={item.mediaItems} />
                    <div className="p-6">
                      <h3 className="text-xl font-black text-stone-900 mb-2 group-hover:text-kelen-green-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-stone-500 text-sm line-clamp-2 mb-3">
                        {item.description}
                      </p>
                      {item.price && (
                        <PriceDisplay amount={item.price} currency={item.currency} className="mb-3" />
                      )}
                      <div className="flex items-center gap-4 text-sm text-stone-400">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {item.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {item.commentCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-stone-50 rounded-3xl border-4 border-dashed border-stone-100">
                <p className="text-stone-400 font-black uppercase tracking-widest text-sm">
                  Aucune réalisation publiée pour le moment
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
