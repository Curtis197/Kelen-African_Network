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
    <div>
      {/* Breadcrumb */}
      <Link
        href="/admin/queue"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour à la file
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          Vérification #{queueItem.id.slice(0, 8)}
        </h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            queueItem.item_type === "recommendation"
              ? "bg-kelen-green-50 text-kelen-green-700"
              : "bg-kelen-red-50 text-kelen-red-700"
          }`}
        >
          {queueItem.item_type === "recommendation" ? "Recommandation" : "Signal"}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission details */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">
              Détails de la soumission
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type de projet / Incident</dt>
                <dd className="font-medium text-foreground">
                  {details.project_type || details.breach_type || "N/A"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lieu</dt>
                <dd className="font-medium text-foreground">
                  {details.location || "N/A"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium text-foreground">
                  {details.completion_date || details.agreed_start_date || "N/A"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Budget / Engagement</dt>
                <dd className="font-medium text-foreground">
                  {details.budget_range || (details.agreed_budget ? `${details.agreed_budget} XOF` : "N/A")}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description / Témoignage
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {details.project_description || details.breach_description || "Aucune description fournie."}
              </p>
            </div>

            {/* Evidence Link */}
            {(details.contract_url || (details.photo_urls && details.photo_urls.length > 0) || (details.evidence_urls && details.evidence_urls.length > 0)) && (
              <div className="mt-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pièces justificatives
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {details.contract_url && (
                    <a 
                      href={details.contract_url} 
                      target="_blank" 
                      className="flex items-center gap-2 p-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="material-symbols-outlined text-kelen-green-600">description</span>
                      <span>Voir le contrat</span>
                    </a>
                  )}
                  {details.photo_urls?.map((url: string, i: number) => (
                    <a 
                      key={i}
                      href={url} 
                      target="_blank" 
                      className="flex items-center gap-2 p-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="material-symbols-outlined text-kelen-yellow-600">image</span>
                      <span>Photo #{i+1}</span>
                    </a>
                  ))}
                  {details.evidence_urls?.map((url: string, i: number) => (
                    <a 
                      key={i}
                      href={url} 
                      target="_blank" 
                      className="flex items-center gap-2 p-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="material-symbols-outlined text-kelen-red-600">attachment</span>
                      <span>Preuve #{i+1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin decision - Form placeholder for now as we'd need server actions */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="font-semibold text-foreground">Décision</h2>
            <form className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Note interne (optionnel)
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                placeholder="Ajouter une note de vérification..."
              />

              <div className="mt-4 flex gap-3">
                <button 
                  type="button" 
                  className="flex-1 rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
                >
                  Approuver
                </button>
                <button 
                  type="button"
                  className="flex-1 rounded-lg bg-kelen-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-red-600"
                >
                  Rejeter
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Professional info */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground">Professionnel</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-bold text-foreground">
                {queueItem.professional?.business_name}
              </p>
              <p className="text-muted-foreground capitalize">
                {queueItem.professional?.category}
              </p>
              <p className="text-muted-foreground">
                {queueItem.professional?.city}, {queueItem.professional?.country}
              </p>
              <p className="text-muted-foreground flex items-center gap-2">
                Statut actuel: 
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  queueItem.professional?.status === 'gold' ? 'bg-kelen-yellow-100 text-kelen-yellow-700' :
                  queueItem.professional?.status === 'silver' ? 'bg-stone-100 text-stone-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {queueItem.professional?.status}
                </span>
              </p>
              <Link
                href={`/pro/${queueItem.professional?.slug}`}
                className="mt-2 inline-block text-xs text-kelen-green-600 hover:text-kelen-green-700 font-medium"
              >
                Voir le profil public →
              </Link>
            </div>
          </div>

          {/* Submitter info */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground">Soumis par</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-foreground">
                {details.submitter_name}
              </p>
              <p className="text-muted-foreground text-xs">{details.submitter_email}</p>
              <p className="text-muted-foreground">
                Pays d&apos;origine : {details.submitter_country}
              </p>
              <p className="text-muted-foreground text-xs mt-2 italic">
                Rôle : Diaspora
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground">Chronologie</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-kelen-yellow-500" />
                <span className="text-muted-foreground">
                  Soumis le{" "}
                  {new Date(queueItem.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-border" />
                <span className="text-muted-foreground">
                  Statut: <span className="capitalize">{queueItem.status}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
