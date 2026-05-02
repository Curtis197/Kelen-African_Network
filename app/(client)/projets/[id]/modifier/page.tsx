import EditClientProjectPage from "./EditClientProjectPage";
import { GoogleMapsScriptProvider } from "@/components/location/GoogleMapsScript";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modifier le projet â€” Kelen",
  description: "Modifiez les informations de votre projet sur Kelen.",
};

export default async function EditProjectPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";


  return (
    <GoogleMapsScriptProvider apiKey={apiKey}>
      <EditClientProjectPage />
    </GoogleMapsScriptProvider>
  );
}
