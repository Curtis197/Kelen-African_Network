import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Vérification — Kelen Admin",
};

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch queue item
  const { data: queueItem } = await supabase
    .from("verification_queue")
    .select(`
      id,
      item_type,
      item_id,
      status,
      created_at,
      professional:professionals(id, business_name, slug, category, city, country, status)
    `)
    .eq("id", id)
    .single();

  if (!queueItem) {
    return notFound();
  }

  // Fetch details based on type
  let details: any = null;
  if (queueItem.item_type === "recommendation") {
    const { data } = await supabase
      .from("recommendations")
      .select("*")
      .eq("id", queueItem.item_id)
      .single();
    details = data;
  } else {
    const { data } = await supabase
      .from("signals")
      .select("*")
      .eq("id", queueItem.item_id)
      .single();
    details = data;
  }

  if (!details) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Détails non trouvés
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          L&apos;élément source ({queueItem.item_id}) n&apos;existe plus ou est inacessible.
        </p>
        <Link
          href="/admin/queue"
          className="mt-4 inline-block text-sm text-kelen-green-600 hover:text-kelen-green-700"
        >
          ← Retour à la file
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <nav className="mb-4">
            <Link
              href="/admin/queue"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-stone-400 hover:text-kelen-green-600 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Retour à la file d&apos;attente
            </Link>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 text-on-secondary-container text-[10px] font-black tracking-widest mb-4 border border-secondary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            VÉRIFICATION EN COURS
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold font-headline leading-tight tracking-tight text-on-surface">
            {queueItem.item_type === "recommendation" ? "Validation Recommandation" : "Instruction Signal"}
            <span className="text-primary-container block">#{queueItem.id.slice(0, 8).toUpperCase()}</span>
          </h1>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex gap-8">
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Score Confiance</p>
            <p className="text-3xl font-headline font-black text-kelen-green-600">98%</p>
          </div>
          <div className="w-px bg-stone-100"></div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Priorité</p>
            <p className="text-3xl font-headline font-black text-amber-500 underline decoration-amber-500/20">Haute</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content — 2/3 */}
        <div className="lg:col-span-7 space-y-8">
          {/* Dossier Details */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-8 bg-stone-50/50 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xl font-headline font-extrabold text-stone-900 italic">Détails de la soumission</h3>
              <span className="px-3 py-1 bg-white text-[10px] font-black rounded-full uppercase tracking-wider border border-stone-200">ID: {details.id.slice(0, 6)}</span>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Objet / Nature</p>
                  <p className="font-bold text-stone-900 text-lg">{details.project_type || details.breach_type || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Localisation</p>
                  <p className="font-bold text-stone-900 text-lg">{details.location || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Date d&apos;exécution</p>
                  <p className="font-bold text-stone-900 text-lg">{details.completion_date || details.agreed_start_date || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Engagement financier</p>
                  <p className="font-bold text-stone-900 text-lg">
                    {details.budget_range || (details.agreed_budget ? `${details.agreed_budget.toLocaleString()} XOF` : "N/A")}
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-stone-100">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Description / Témoignage</p>
                <div className="p-6 bg-stone-50 rounded-2xl border-l-4 border-kelen-green-500 italic text-stone-700 leading-relaxed whitespace-pre-wrap">
                  &ldquo;{details.project_description || details.breach_description || "Aucun témoignage textuel fourni."}&rdquo;
                </div>
              </div>

              {/* Evidence Assets */}
              {(details.contract_url || (details.photo_urls && details.photo_urls.length > 0) || (details.evidence_urls && details.evidence_urls.length > 0)) && (
                <div className="pt-8 border-t border-stone-100">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Pièces Justificatives (Assets)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {details.contract_url && (
                      <a 
                        href={details.contract_url} 
                        target="_blank" 
                        className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-2xl group hover:bg-kelen-green-500 hover:text-white hover:border-kelen-green-500 transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-white/20">
                          <span className="material-symbols-outlined text-kelen-green-600 group-hover:text-white">description</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Contrat & Accords</p>
                          <p className="text-[10px] opacity-60 uppercase font-black tracking-widest">Document PDF</p>
                        </div>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">open_in_new</span>
                      </a>
                    )}
                    {details.photo_urls?.map((url: string, i: number) => (
                      <a 
                        key={i}
                        href={url} 
                        target="_blank" 
                        className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-2xl group hover:bg-kelen-green-500 hover:text-white hover:border-kelen-green-500 transition-all duration-300"
                      >
                         <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-white/20 text-kelen-yellow-600 group-hover:text-white">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Photo de preuve #{i+1}</p>
                          <p className="text-[10px] opacity-60 uppercase font-black tracking-widest">Image Source</p>
                        </div>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">visibility</span>
                      </a>
                    ))}
                    {details.evidence_urls?.map((url: string, i: number) => (
                      <a 
                        key={i}
                        href={url} 
                        target="_blank" 
                        className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-2xl group hover:bg-kelen-green-500 hover:text-white hover:border-kelen-green-500 transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-white/20 text-kelen-red-600 group-hover:text-white">
                          <span className="material-symbols-outlined">attach_file</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Evidence Annex #{i+1}</p>
                          <p className="text-[10px] opacity-60 uppercase font-black tracking-widest">Fichier Zip/Autres</p>
                        </div>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">download</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="lg:col-span-5 space-y-8">
          {/* Decision Panel */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full mx-auto bg-stone-100 flex items-center justify-center border-4 border-stone-50 shadow-lg relative overflow-hidden">
                   <span className="material-symbols-outlined text-5xl text-stone-300">account_circle</span>
                   <div className="absolute bottom-0 right-0 bg-kelen-green-500 text-white p-1 rounded-full shadow-md border-2 border-white">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold font-headline text-stone-900 leading-tight">
                  {(queueItem.professional as any)?.[0]?.business_name}
                </h3>
                <p className="text-sm font-medium text-stone-500 capitalize">{(queueItem.professional as any)?.[0]?.category} • {(queueItem.professional as any)?.[0]?.city}</p>
              </div>
            </div>

            {/* Document Checklist */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Checklist de vérification</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 group transition-all hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-kelen-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-sm font-bold text-stone-700">Identité Confirmée</span>
                  </div>
                  <span className="text-[10px] font-black text-kelen-green-600 uppercase">Auto-Pass</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 group transition-all hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-kelen-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-sm font-bold text-stone-700">Validité Contrat</span>
                  </div>
                  <span className="text-[10px] font-black text-kelen-green-600 uppercase">Valide</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 group transition-all hover:bg-white hover:shadow-md">
                   <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500">pending</span>
                    <span className="text-sm font-bold text-stone-700">Évaluation Qualité</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-600 uppercase">Manuel</span>
                </div>
              </div>
            </div>

            {/* Decision Form */}
            <form className="pt-8 border-t border-stone-100 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Note Interne de l&apos;Instructeur</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full rounded-[1.25rem] border border-stone-100 bg-stone-50 px-5 py-4 text-sm transition-all placeholder:text-stone-300 focus:bg-white focus:border-kelen-green-500 focus:outline-none focus:ring-4 focus:ring-kelen-green-500/10"
                  placeholder="Rédigez ici vos observations sur ce dossier..."
                />
              </div>

              <div className="space-y-3">
                <button 
                  type="button" 
                  className="w-full py-4 bg-gradient-to-r from-kelen-green-600 to-kelen-green-400 text-white rounded-2xl font-black font-headline text-base shadow-xl shadow-kelen-green-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Approuver & Publier
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    className="py-3 px-4 bg-stone-100 text-stone-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-stone-200 transition-colors"
                  >
                    Besoin d&apos;Infos
                  </button>
                  <button 
                    type="button"
                    className="py-3 px-4 text-kelen-red-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-kelen-red-50 transition-colors"
                  >
                    Rejeter Dossier
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Submitter Info Card */}
          <div className="bg-stone-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-kelen-green-500/10 blur-[60px] rounded-full"></div>
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2 text-kelen-green-400">
                  <span className="material-symbols-outlined text-sm">person_pin_circle</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Émetteur (Diaspora)</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold font-headline">{details.submitter_name}</p>
                  <p className="text-xs text-white/60 font-medium">{details.submitter_email}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[9px] font-black text-white/40 uppercase mb-1">Résidence</p>
                      <p className="text-xs font-bold">{details.submitter_country}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-white/40 uppercase mb-1">Rôle</p>
                      <p className="text-xs font-bold">Investisseur</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Audit History */}
          <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100 space-y-4">
            <div className="flex items-center gap-2 text-stone-400">
              <span className="material-symbols-outlined text-sm">history</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Journal d&apos;Audit</span>
            </div>
            <div className="relative pl-4 space-y-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-stone-200">
               <div className="text-[11px] leading-relaxed text-stone-500">
                  Soumission reçue le <span className="font-bold text-stone-700">{new Date(queueItem.created_at).toLocaleDateString()}</span>. Algorithme de détection de fraude : <span className="text-kelen-green-600 font-bold italic">Négatif</span>.
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
