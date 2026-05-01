import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAreas, getProfessionsByArea } from "@/lib/actions/taxonomy";
import { getProfessionalsByArea } from "@/lib/actions/professionals";
import { SectorPageClient } from "./SectorPageClient";

interface SectorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const areas = await getAreas();
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: SectorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const areas = await getAreas();
  const area = areas.find((a) => a.slug === slug);
  if (!area) return {};
  return {
    title: `${area.name} — Kelen`,
    description: `Trouvez des professionnels en ${area.name} sur Kelen.`,
  };
}

export default async function SectorPage({ params }: SectorPageProps) {
  const { slug } = await params;
  const areas = await getAreas();
  const area = areas.find((a) => a.slug === slug);
  if (!area) notFound();

  const [professions, { professionals, totalCount }] = await Promise.all([
    getProfessionsByArea(area.id),
    getProfessionalsByArea(slug),
  ]);

  return (
    <SectorPageClient
      area={area}
      professions={professions}
      initialProfessionals={professionals}
      initialTotalCount={totalCount}
    />
  );
}
