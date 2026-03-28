import Link from "next/link";
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
        {/* Mobile top bar — visible only when desktop sidebar is hidden */}
        <div className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-white px-4 lg:hidden">
          <Link href="/" className="text-base font-bold text-foreground">
            Kelen
          </Link>
          <span className="ml-2 rounded bg-kelen-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-kelen-red-700">
            Admin
          </span>
        </div>
        <div className="p-4 pb-24 lg:p-8 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
