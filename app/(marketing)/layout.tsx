import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GoogleMapsScriptProvider } from "@/components/location/GoogleMapsScript";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <GoogleMapsScriptProvider apiKey={GOOGLE_MAPS_API_KEY}>
          {children}
        </GoogleMapsScriptProvider>
      </main>
      <Footer />
    </>
  );
}
