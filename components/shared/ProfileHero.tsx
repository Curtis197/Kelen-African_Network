import Image from "next/image";
import { ArrowRight } from "lucide-react";

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
    <section className="relative min-h-[60vh] md:min-h-[80vh] flex items-center pt-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          className="object-cover"
          src={bgImage}
          alt=""
          priority={true}
          fill
          sizes="100vw"
        />
        {/* Gradient overlay — darker on left, lighter on right so image shows */}
        <div className="absolute inset-0 bg-gradient-to-r from-on-surface/70 via-on-surface/40 to-transparent"></div>
      </div>

      {/* Hero Content — compact card anchored to the left */}
      <div className="relative z-10 w-full px-4 md:px-12 lg:px-20">
        <div className="max-w-md md:max-w-lg">
          {/* Compact glass card */}
          <div className="bg-surface/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-outline-variant/10 shadow-xl">
            <h1 className="font-headline font-bold text-2xl md:text-4xl tracking-tight text-on-surface leading-tight">
              {businessName}
            </h1>
            <p className="font-body text-sm md:text-lg text-on-surface-variant/90 font-medium mt-3 mb-6 border-l-2 border-primary pl-4">
              {tagline}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#contact"
                className="bg-primary text-on-primary px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
              >
                Consulter Profil
                <ArrowRight className="text-sm" />
              </a>
              <a
                href="#portfolio"
                className="bg-surface-container-high/80 backdrop-blur text-on-surface px-5 py-3 rounded-xl text-sm font-bold hover:bg-surface-container-high transition-colors"
              >
                Voir Réalisations
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
