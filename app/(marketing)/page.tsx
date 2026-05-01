export const revalidate = 3600;

import { SectorGrid } from "@/components/landing/SectorGrid";
import { ProfessionalDirectory } from "@/components/landing/ProfessionalDirectory";
import { createClient } from "@/lib/supabase/server";
import { getAreasSortedByPopularity } from "@/lib/actions/taxonomy";

export default async function SearchHubPage() {
  const supabase = await createClient();

  const [areas, { data: featured }] = await Promise.all([
    getAreasSortedByPopularity({ all: true }),
    supabase
      .from("professionals")
      .select("*, professional_portfolio(custom_domain, domain_status)")
      .order("recommendation_count", { ascending: false })
      .limit(12),
  ]);

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl lg:text-6xl font-display">
            Trouvez le bon professionnel.
            <br />Construisez en confiance.
          </h1>
          <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
            Un électricien, un médecin, un développeur, un avocat — vérifiés sur Kelen.
          </p>
        </div>
        <SectorGrid areas={areas} />
        <ProfessionalDirectory initialPros={featured || []} />
      </div>
    </main>
  );
}
