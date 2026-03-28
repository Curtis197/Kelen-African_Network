import { ProSidebar } from "@/components/layout/ProSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <ProSidebar />
        <main className="flex-1 bg-muted/30">
          <div className="p-4 pb-24 lg:p-8 lg:pb-8">{children}</div>
        </main>
      </div>
      <div className="hidden lg:block"><Footer /></div>
    </div>
  );
}
