import { Play } from "lucide-react";

export type MediaItem =
  | { type: "image"; url: string }
  | { type: "video"; url: string; thumbnail_url?: string | null };

export function MediaContent({
  item,
  hover = true,
}: {
  item: MediaItem;
  hover?: boolean;
}) {
  const scaleClass = hover
    ? "transition-transform duration-700 group-hover:scale-110"
    : "";

  if (item.type === "image") {
    return (
      <img
        src={item.url}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover ${scaleClass}`}
      />
    );
  }

  if (item.thumbnail_url) {
    return (
      <>
        <img
          src={item.thumbnail_url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover ${scaleClass}`}
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

/**
 * Social-media-style mixed media grid.
 * - 1 item  → full container, aspect-[4/3]
 * - 2 items → side-by-side halves
 * - 3+      → large left (row-span-2) + two stacked right cells; "+N" overlay if >3
 */
export function MediaGrid({ items }: { items: MediaItem[] }) {
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

/** Build a MediaItem array from Supabase realization data */
export function buildMediaItems(
  images: Array<{ id?: string; url: string; is_main?: boolean }> | null | undefined,
  videos: Array<{ id?: string; url: string; thumbnail_url?: string | null; order_index?: number | null }> | null | undefined,
  fallbackUrl = "https://images.unsplash.com/photo-1600585154340-be6199f7d209?auto=format&fit=crop&q=80"
): MediaItem[] {
  const rawImages = images || [];
  const mainIdx = rawImages.findIndex((img) => img.is_main);
  const orderedImages =
    mainIdx > 0
      ? [rawImages[mainIdx], ...rawImages.filter((_, i) => i !== mainIdx)]
      : rawImages;

  const imageItems: MediaItem[] = orderedImages.map((img) => ({
    type: "image",
    url: img.url,
  }));

  const videoItems: MediaItem[] = [...(videos || [])]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((v) => ({
      type: "video",
      url: v.url,
      thumbnail_url: v.thumbnail_url ?? null,
    }));

  const all = [...imageItems, ...videoItems];
  return all.length > 0 ? all : [{ type: "image", url: fallbackUrl }];
}
