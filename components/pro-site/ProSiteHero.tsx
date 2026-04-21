export function ProSiteHero({
  coverImageUrl,
  profession,
  proName,
  subtitle,
}: {
  coverImageUrl: string | null
  profession: string
  proName: string
  subtitle: string | null
}) {
  return (
    <section
      className="relative flex items-end"
      style={{ height: '80vh' }}
    >
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={proName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2c3e6b] to-[#1a1a2e]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="relative z-10 px-6 pb-8 text-white">
        <p className="text-xs uppercase tracking-[3px] opacity-55 mb-1">{profession}</p>
        <h1 className="text-4xl font-black leading-none mb-2">{proName}</h1>
        {subtitle && <p className="text-sm opacity-65">{subtitle}</p>}
      </div>
    </section>
  )
}
