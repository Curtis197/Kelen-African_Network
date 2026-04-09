import { ProSidebar } from "@/components/layout/ProSidebar";
import { Footer } from "@/components/layout/Footer";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <ProSidebar />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
