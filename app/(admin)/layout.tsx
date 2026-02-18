import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-muted/30">
        {/* Mobile header */}
        <div className="flex h-16 items-center border-b border-border bg-white px-4 lg:hidden">
          <span className="text-lg font-bold text-foreground">Kelen</span>
          <span className="ml-2 rounded bg-kelen-red-50 px-1.5 py-0.5 text-xs font-medium text-kelen-red-700">
            Admin
          </span>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
