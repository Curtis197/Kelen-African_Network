import { NavbarMarketingPro } from "@/components/layout/NavbarMarketingPro";
import { Footer } from "@/components/layout/Footer";

export default function MarketingProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarMarketingPro />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
