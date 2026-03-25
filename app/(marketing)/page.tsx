import { Suspense } from "react";
import { ProfessionalDirectory } from "@/components/landing/ProfessionalDirectory";

export default function SearchHubPage() {
  return (
    <main className="min-h-screen bg-surface">
      <ProfessionalDirectory />
    </main>
  );
}
