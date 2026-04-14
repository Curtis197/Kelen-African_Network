import { ProListPage } from "@/components/collaboration/ProListPage";

export default function ProListRoute() {
  console.log("[ProListRoute] Rendering pro list route page");

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-5xl w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <ProListPage />
      </div>
    </main>
  );
}
