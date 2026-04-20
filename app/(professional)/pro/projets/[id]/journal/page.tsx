import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProProjectJournal } from "@/components/pro/ProProjectJournal";
import { getProProject } from "@/lib/actions/pro-projects";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProProject(id);
  if (!project) return { title: "Journal introuvable" };
  return { title: `Journal : ${project.title} — Kelen Pro` };
}

export default async function ProProjectJournalPage({ params }: Props) {
  const { id } = await params;
  const project = await getProProject(id);

  if (!project) {
    notFound();
  }

  // NOTE: Professionals ARE allowed to see the journal for collaborations,
  // but they use different IDs/tables which the component now handles.

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <ProProjectJournal project={project} />
    </div>
  );
}
