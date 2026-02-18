import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function DiasporaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 bg-muted/30">
        {/* Mobile header */}
        <div className="flex h-16 items-center border-b border-border bg-white px-4 lg:hidden">
          <span className="text-lg font-bold text-foreground">Kelen</span>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
