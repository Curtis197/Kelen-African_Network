import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProProjectDetail } from "@/components/pro/ProProjectDetail";
import { getProProject } from "@/lib/actions/pro-projects";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProProject(id);
  if (!project) return { title: "Projet introuvable" };
  return { title: `${project.title} — Kelen Pro` };
}

export default async function ProProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProProject(id);
  if (!project) notFound();

  return <ProProjectDetail project={project} />;
}
