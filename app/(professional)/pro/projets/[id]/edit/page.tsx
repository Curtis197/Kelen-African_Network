import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProProject } from "@/lib/actions/pro-projects";
import { ProProjectEditForm } from "@/components/pro/ProProjectEditForm";

export const metadata: Metadata = {
  title: "Modifier le projet — Kelen Pro",
};

export default async function EditProProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id || id === 'null' || id === 'undefined') {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const project = await getProProject(id);

  if (!project) {
    notFound();
  }

  // Verify ownership
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional || project.professional_id !== professional.id) {
    notFound();
  }

  return <ProProjectEditForm project={project} />;
}
