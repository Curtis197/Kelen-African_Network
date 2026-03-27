import ProjectWizard from "@/components/projects/ProjectWizard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau Projet",
  description: "Créez votre nouveau projet immobilier sur Kelen.",
};

export default function NouveauProjetPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id;
  return (
    <div className="-m-6 lg:-m-8"> 
      {/* 
        We use negative margins to offset the padding in (client)/layout.tsx
        and take full control of the wizard layout.
      */}
      <ProjectWizard initialId={id} />
    </div>
  );
}
