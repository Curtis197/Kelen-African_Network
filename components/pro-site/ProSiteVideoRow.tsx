// components/pro-site/ProSiteVideoRow.tsx
export function ProSiteVideoRow({ videos }: { videos: { url: string; durationSeconds?: number }[] }) {
  if (videos.length === 0) return null

  function formatDuration(s?: number): string {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <section className="bg-[var(--pro-surface-alt,#f5f5f5)] px-6 py-6 border-t border-[var(--pro-border,#eee)]">
      <h3 className="font-extrabold text-sm text-[var(--pro-text,#1a1a2e)] mb-3">
        Vidéos <span className="font-normal text-[var(--pro-text-muted,#888)]">· {videos.length}</span>
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {videos.map((v, i) => (
          <a
            key={i}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 relative w-40 h-24 rounded-[var(--pro-radius,16px)] overflow-hidden bg-[#1a1a2e] flex items-center justify-center"
          >
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <span className="text-[#1a1a2e] text-sm ml-0.5">▶</span>
            </div>
            {v.durationSeconds && (
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-1.5 py-0.5 rounded">
                {formatDuration(v.durationSeconds)}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
