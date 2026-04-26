export const revalidate = 3600;

import { Suspense } from "react";
import { ProfessionalDirectory } from "@/components/landing/ProfessionalDirectory";
import { createClient } from "@/lib/supabase/server";
import { getAreas, getAllProfessions } from "@/lib/actions/taxonomy";

interface SearchHubPageProps {
  searchParams: Promise<{ areaId?: string; professionId?: string; projectId?: string; areaName?: string }>;
}

export default async function SearchHubPage({ searchParams }: SearchHubPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  
  const { data: professionals } = await supabase
    .from("professionals")
    .select("*")
    .order("recommendation_count", { ascending: false })
    .limit(12);

  const { count } = await supabase
    .from("professionals")
    .select("*", { count: "exact", head: true });

  const [areas, allProfessions] = await Promise.all([getAreas(), getAllProfessions()]);

  return (
    <main className="min-h-screen bg-surface">
      <ProfessionalDirectory
        initialPros={professionals || []}
        totalCount={count || 0}
        areas={areas}
        allProfessions={allProfessions}
        initialAreaId={params.areaId}
        initialProfessionId={params.professionId}
        initialProjectId={params.projectId}
      />
    </main>
  );
}
