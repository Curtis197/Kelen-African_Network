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
  
  // Fetch only non-blacklisted professionals for the initial grid
  // We prioritize those with high recommendation counts to fulfill the "Trusted" promise
  let { data: professionals } = await supabase
    .from("professionals")
    .select("*")
    .neq("status", "black")
    .order("recommendation_count", { ascending: false })
    .limit(12);

  // Sort by premium status (Gold > Silver > White > Red)
  // Within the same status, they are already ordered by recommendation count from the DB query
  const statusOrder = { gold: 0, silver: 1, white: 2, red: 3, black: 4 };
  professionals = professionals?.sort((a, b) => {
    const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 99;
    const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 99;
    
    if (statusA !== statusB) {
      return statusA - statusB;
    }
    
    // Fallback sort by recommendation count (should already be partially sorted but let's be explicit)
    return (b.recommendation_count || 0) - (a.recommendation_count || 0);
  }) || [];

  // Get total count of non-blacklisted experts
  const { count } = await supabase
    .from("professionals")
    .select("*", { count: "exact", head: true })
    .neq("status", "black");

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
