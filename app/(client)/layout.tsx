import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function DiasporaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl w-full">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
