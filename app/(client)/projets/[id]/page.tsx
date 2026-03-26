"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import ProjectTimeline, { Phase } from "@/components/shared/ProjectTimeline";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_total: number;
  budget_currency: string;
  status: string;
  created_at: string;
  objectives: Phase[];
}

interface ProjectProfessional {
  id: string;
  is_external: boolean;
  external_name: string | null;
  external_category: string | null;
  role: string;
  professional_id: string | null;
  professionals: {
    business_name: string;
    category: string;
    portfolio_photos: string[] | null;
    status: string;
    slug: string;
  } | null;
}

interface Payment {
  id: string;
  label: string;
  amount: number;
  currency: string;
  paid_at: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<ProjectProfessional[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    setIsLoading(true);
    
    // Fetch Project
    const { data: projectData, error: projectError } = await supabase
      .from("user_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
    } else {
      setProject(projectData as Project);
    }

    // Fetch Team
    const { data: teamData, error: teamError } = await supabase
      .from("project_professionals")
      .select("*, professionals(business_name, category, portfolio_photos, status, slug)")
      .eq("project_id", id);

    if (teamError) {
      console.error("Error fetching team:", teamError);
    } else {
      setTeam(teamData as any[]);
    }

    // Fetch Payments
    const { data: paymentData, error: paymentError } = await supabase
      .from("project_payments")
      .select("*")
      .eq("project_id", id);

    if (paymentError) {
      console.error("Error fetching payments:", paymentError);
    } else {
      setPayments(paymentData as Payment[]);
    }

    setIsLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("user_projects")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error && project) {
      setProject({ ...project, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-kelen-green-200 border-t-kelen-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Projet introuvable</h1>
        <Link href="/client/projets" className="text-kelen-green-600 font-bold hover:underline">
          Retour à mes projets
        </Link>
      </div>
    );
  }

  const totalSpent = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const spentPercent = project.budget_total > 0 ? Math.round((totalSpent / project.budget_total) * 100) : 0;

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
            <Link href="/client/projets" className="hover:text-stone-600 transition-colors">Mes Projets</Link>
            <span className="text-stone-300">/</span>
            <span className="text-kelen-green-600">{project.title}</span>
          </nav>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-extrabold text-stone-900 tracking-tight leading-none">
                {project.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative inline-block">
                  <select 
                    value={project.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="appearance-none bg-stone-100 text-stone-700 px-5 py-2 pr-10 rounded-xl font-bold text-xs cursor-pointer focus:ring-2 focus:ring-kelen-green-500/20 border-none transition-all"
                  >
                    <option value="en_preparation">En préparation</option>
                    <option value="en_cours">En cours</option>
                    <option value="en_pause">En pause</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">expand_more</span>
                </div>
                <div className="flex items-center gap-2 text-stone-500 text-sm">
                  <span className="material-symbols-outlined text-base">location_on</span>
                  <span>{project.location}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-white text-stone-700 font-bold rounded-xl shadow-sm border border-stone-200 hover:bg-stone-50 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">share</span>
                Partager
              </button>
              <button className="px-8 py-3 bg-kelen-green-500 text-white font-bold rounded-xl shadow-lg shadow-kelen-green-500/20 hover:bg-kelen-green-600 transition-all active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">add</span>
                Ajouter une tâche
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Project Timeline - Premium Edition */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black font-headline text-stone-900 tracking-tight">Chronologie du projet</h3>
                  <p className="text-stone-500 font-medium mt-1">Suivez l&apos;avancement de votre chantier en temps réel.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-kelen-green-50 rounded-full border border-kelen-green-100">
                  <span className="w-2 h-2 rounded-full bg-kelen-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kelen-green-600">Live Sync</span>
                </div>
              </div>

              {project.objectives && project.objectives.length > 0 ? (
                <ProjectTimeline phases={project.objectives} />
              ) : (
                <div className="p-12 text-center bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">
                  <span className="material-symbols-outlined text-4xl text-stone-300 mb-4">event_note</span>
                  <p className="text-stone-500 font-medium italic">Aucune étape n&apos;est encore définie pour ce projet.</p>
                </div>
              )}
            </div>

            {/* Team */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-stone-900">Équipe d&apos;experts</h3>
                <button className="text-xs font-bold text-kelen-green-600 hover:underline px-3 py-1 bg-kelen-green-50 rounded-full">
                  Inviter un expert
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.map((member) => (
                  <div key={member.id} className="p-5 bg-stone-50 rounded-2xl flex items-center gap-4 group transition-all hover:bg-stone-100 cursor-pointer">
                    <div className="relative">
                      {member.is_external ? (
                        <div className="w-14 h-14 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                          <span className="material-symbols-outlined text-2xl">person</span>
                        </div>
                      ) : (
                        <img 
                          alt={member.professionals?.business_name} 
                          className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-white" 
                          src={member.professionals?.portfolio_photos?.[0] || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80"} 
                        />
                      )}
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
                        <span className={`material-symbols-outlined text-[10px] block ${member.is_external ? 'text-stone-400' : 'text-amber-500'}`}>
                          {member.is_external ? 'person_add' : 'verified'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-stone-900 text-sm">
                        {member.is_external ? member.external_name : member.professionals?.business_name}
                      </h5>
                      <p className="text-[11px] text-stone-500 font-medium uppercase tracking-wider">
                        {member.is_external ? member.external_category : member.professionals?.category}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-white text-stone-500 border border-stone-200 text-[9px] font-bold rounded-full uppercase">
                           {member.role}
                        </span>
                      </div>
                    </div>
                    {member.professionals?.slug && (
                      <Link href={`/pro/${member.professionals.slug}`} className="text-stone-300 group-hover:text-stone-900 transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_forward_ios</span>
                      </Link>
                    )}
                  </div>
                ))}
                {team.length === 0 && (
                  <p className="text-stone-400 text-sm italic col-span-2 text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    Aucun expert n&apos;est encore rattaché à ce projet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Budget */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200/50">
              <h3 className="text-xl font-bold text-stone-900 mb-8 border-b border-stone-100 pb-4">Suivi budgétaire</h3>
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-stone-100" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12" />
                    <circle 
                      className="text-kelen-green-500 transition-all duration-1000 ease-out" 
                      cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" 
                      strokeWidth="12" 
                      strokeDasharray={552.92}
                      strokeDashoffset={552.92 - (552.92 * spentPercent) / 100}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-stone-900">{spentPercent}%</span>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.2em] mt-1">Engagé</span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Total alloué</span>
                    <span className="font-bold text-stone-900 text-sm">
                      {project.budget_total.toLocaleString()} {project.budget_currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-kelen-green-50/50 rounded-2xl border border-kelen-green-100/50">
                    <span className="text-xs font-bold text-kelen-green-700 uppercase tracking-widest">Dépensé</span>
                    <span className="font-bold text-kelen-green-900 text-sm">
                      {totalSpent.toLocaleString()} {project.budget_currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900">Documents du projet</h3>
                <span className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-lg text-stone-500">
                  <span className="material-symbols-outlined text-sm">inventory_2</span>
                </span>
              </div>
              
              <div className="space-y-3">
                {team.length > 0 ? (
                  team.map((member) => (
                    <div key={member.id} className="p-4 bg-stone-50 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3 text-stone-400 italic text-xs">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>Documents en attente de partage par {member.is_external ? member.external_name : member.professionals?.business_name}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    <span className="material-symbols-outlined text-3xl text-stone-200 mb-2">description</span>
                    <p className="text-xs text-stone-400">Aucun document n&apos;est encore lié à ce projet.</p>
                  </div>
                )}
              </div>
              
              <button className="w-full mt-6 py-4 text-xs font-bold text-kelen-green-600 bg-kelen-green-50 rounded-2xl hover:bg-kelen-green-100 transition-all uppercase tracking-widest">
                Rejoindre le coffre-fort
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
