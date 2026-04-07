import ProjectWizard from "@/components/projects/ProjectWizard";
import { Metadata } from "next";
import { GoogleMapsScriptProvider } from "@/components/location/GoogleMapsScript";

export const metadata: Metadata = {
  title: "Nouveau Projet",
  description: "Créez votre nouveau projet immobilier sur Kelen.",
};

export default async function NouveauProjetPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

  return (
    <GoogleMapsScriptProvider apiKey={apiKey}>
      <div className="-m-6 lg:-m-8">
        {/*
          We use negative margins to offset the padding in (client)/layout.tsx
          and take full control of the wizard layout.
        */}
        <ProjectWizard initialId={id} />
      </div>
    </GoogleMapsScriptProvider>
  );
}
