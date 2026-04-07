import { ProSidebar } from "@/components/layout/ProSidebar";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <ProSidebar />
        <main className="flex-1 bg-surface">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
