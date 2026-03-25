import { ProSidebar } from "@/components/layout/ProSidebar";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <ProSidebar />
      <main className="flex-1 bg-muted/30">
        {/* Mobile header */}
        <div className="flex h-16 items-center border-b border-border bg-white px-4 lg:hidden">
          <span className="text-lg font-bold text-foreground">Kelen</span>
          <span className="ml-2 rounded bg-kelen-green-50 px-1.5 py-0.5 text-xs font-medium text-kelen-green-700">
            Pro
          </span>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
