interface ProfileHeroProps {
  businessName: string;
  tagline: string;
  backgroundImage?: string;
}

export function ProfileHero({
  businessName,
  tagline,
  backgroundImage,
}: ProfileHeroProps) {
  // Use a premium placeholder if no background image is provided
  const bgImage = backgroundImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuBhy_lQ8urtFRkZBPEwxM8LcMKZG30YLGgnjunfOdnas-7oKII6-WB19KJ0PKVqxQKxjmED8J2rcBY8gLNz1Iaf4fXVxdAcrcG0XrFx63OFiNUnpXy_FblWyQTRZ48jopoPInCi7fgO8YKjiDN6lHDPzyWq5O8wyRpiRysgpS-o23wlIr9aIVVmMK0vgDoy9-kNtTZHbo-dAQqkWiGVFgE-QkSQwsVxhbkhyORAv7zL3JIN2r-WO4tOtO7eBlfvavPMAUba843ZdO4";

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover"
          src={bgImage}
          alt={businessName}
        />
        <div className="absolute inset-0 bg-on-surface/40"></div>
      </div>

      {/* Hero Content Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-5xl px-8">
        <div className="bg-surface/70 backdrop-blur-2xl p-12 md:p-20 rounded-2xl border border-outline-variant/15 max-w-3xl shadow-2xl">
          <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tighter text-on-surface mb-6 leading-tight">
            {businessName}
          </h1>
          <p className="font-body text-xl md:text-2xl text-on-surface-variant font-medium mb-10 border-l-4 border-primary pl-6">
            {tagline}
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#contact"
              className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
            >
              Consulter Profil
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
            <a
              href="#portfolio"
              className="bg-surface-container-high text-on-surface px-8 py-4 rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
            >
              Voir Réalisations
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
