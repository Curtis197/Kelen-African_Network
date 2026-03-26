import { Suspense } from "react";
import { ProfessionalDirectory } from "@/components/landing/ProfessionalDirectory";
import { createClient } from "@/lib/supabase/server";

export default async function SearchHubPage() {
  const supabase = await createClient();
  
  // Fetch only non-blacklisted professionals for the initial grid
  let { data: professionals } = await supabase
    .from("professionals")
    .select("*")
    .neq("status", "black")
    .limit(12);

  // Sort by premium status (Gold > Silver > White > Red)
  const statusOrder = { gold: 0, silver: 1, white: 2, red: 3, black: 4 };
  professionals = professionals?.sort((a, b) => 
    (statusOrder[a.status as keyof typeof statusOrder] ?? 99) - 
    (statusOrder[b.status as keyof typeof statusOrder] ?? 99)
  ) || [];

  // Get total count of non-blacklisted experts
  const { count } = await supabase
    .from("professionals")
    .select("*", { count: "exact", head: true })
    .neq("status", "black");

  return (
    <main className="min-h-screen bg-surface">
      <ProfessionalDirectory 
        initialPros={professionals || []} 
        totalCount={count || 0}
      />
    </main>
  );
}
