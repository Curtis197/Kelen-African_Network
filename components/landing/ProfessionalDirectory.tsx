import { Professional } from "@/lib/supabase/types";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";

interface ProfessionalDirectoryProps {
  initialPros: Professional[];
}

export function ProfessionalDirectory({ initialPros }: ProfessionalDirectoryProps) {
  if (initialPros.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-on-surface">
        Professionnels en vedette
      </h2>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {initialPros.map((pro) => {
          const portfolio = (pro as any).professional_portfolio?.[0];
          const customDomain =
            portfolio?.domain_status === "active" ? portfolio.custom_domain : null;
          return (
            <ProfessionalCard
              key={`${pro.id}-${pro.slug}`}
              id={pro.id}
              slug={pro.slug}
              businessName={pro.business_name}
              ownerName={pro.owner_name}
              category={pro.category}
              city={pro.city}
              country={pro.country}
              status={pro.status}
              recommendationCount={pro.recommendation_count}
              signalCount={pro.signal_count}
              avgRating={pro.avg_rating}
              reviewCount={pro.review_count}
              profilePictureUrl={pro.portfolio_photos?.[0]}
              customDomain={customDomain}
            />
          );
        })}
      </div>
    </section>
  );
}
