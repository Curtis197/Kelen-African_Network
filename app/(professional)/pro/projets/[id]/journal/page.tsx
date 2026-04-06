"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProProject } from "@/lib/types/pro-projects";
import { ProProjectJournal } from "@/components/pro/ProProjectJournal";

export default function ProProjectJournalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadProject = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const { data: pro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pro) { router.push("/"); return; }

      const { data: proj } = await supabase
        .from("pro_projects")
        .select("*")
        .eq("id", projectId)
        .eq("professional_id", pro.id)
        .single();

      setProject(proj);
      setIsLoading(false);
    };

    loadProject();
  }, [projectId, router, supabase]);

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-surface-container-low rounded-2xl" />;
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-on-surface mb-4">Projet introuvable</h1>
      </div>
    );
  }

  return <ProProjectJournal project={project} />;
}
