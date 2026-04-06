import type { Metadata } from "next";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectDocumentCard } from "@/components/pro/RealizationCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ProjectDocument } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Mes réalisations — Kelen Pro",
  description: "Gérez vos projets et démonstrations de savoir-faire sur Kelen.",
};

export default async function ProRealisationsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Session expirée. Veuillez vous reconnecter.</p>
      </div>
    );
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, business_name")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return (
      <EmptyState
        title="Profil professionnel non trouvé"
        description="Veuillez d'abord compléter votre profil pour gérer vos réalisations."
        action={
          <Link 
            href="/pro/profil"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-kelen-green-600 px-6 font-medium text-white transition-all hover:bg-kelen-green-700"
          >
            Compléter mon profil
          </Link>
        }
      />
    );
  }

  const { data: documents } = await supabase
    .from("project_documents")
    .select("*")
    .eq("professional_id", professional.id)
    .order("created_at", { ascending: false });

  const projectDocs = (documents || []) as ProjectDocument[];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
            Mes réalisations
          </h1>
          <p className="text-on-surface-variant/70 leading-relaxed max-w-lg">
            Gérez vos projets, photographies de chantier et documents techniques pour convaincre vos futurs clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href="/pro/realisations/add"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-6 font-headline text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-4px_rgba(0,150,57,0.3)] active:scale-95"
          >
            <Plus size={18} />
            <span>Nouvelle réalisation</span>
          </Link>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm font-medium text-on-surface-variant">
           <span>{projectDocs.length} projet{projectDocs.length > 1 ? 's' : ''} au total</span>
        </div>
        
        <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-on-surface shadow-sm transition-all" title="Grille">
            <LayoutGrid size={16} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-white/50 transition-all" title="Liste">
            <List size={16} />
          </button>
        </div>
      </div>

      {projectDocs.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {projectDocs.map((doc) => (
            <ProjectDocumentCard 
              key={doc.id}
              document={doc}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-[2rem]">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container-lowest text-on-surface-variant/20 shadow-sm">
             <LayoutGrid size={40} strokeWidth={1} />
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">C'est encore vide ici !</h2>
          <p className="mt-2 text-on-surface-variant/70 text-center max-w-sm">
            Commencez par ajouter votre premier projet pour mettre en avant vos compétences auprès de la Diaspora.
          </p>
          <Link 
            href="/pro/realisations/add"
            className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent bg-kelen-green-50 px-6 font-headline text-sm font-bold text-kelen-green-700 transition-all hover:bg-kelen-green-100"
          >
            Ajouter mon premier projet
          </Link>
        </div>
      )}
    </div>
  );
}
