import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Shield, MapPin, Briefcase, Calendar, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "Liste Noire — Professionnels bannis | Kelen Admin",
};

export default async function BlacklistedProfessionalsPage() {
  const supabase = await createClient();


  // Fetch all professionals with status = 'black'
  const { data: blacklistedPros, error: prosError } = await supabase
    .from("professionals")
    .select("*")
    .eq("status", "black")
    .order("signal_count", { ascending: false });


  if (prosError?.code === '42501') {
    console.error('[blacklisted] RLS access denied — check admin policies on professionals table', prosError)
  }

  if (prosError && prosError.code !== '42501') {
    return (
      <div className="rounded-xl border border-kelen-red-200 bg-kelen-red-50 p-6 text-kelen-red-700 text-sm font-medium">
        Erreur lors du chargement de la liste noire : {prosError.message}
      </div>
    )
  }

  // Fetch signals for each blacklisted pro
  const signalsByPro: Record<string, any[]> = {};
  if (blacklistedPros && blacklistedPros.length > 0) {
    const proIds = blacklistedPros.map(p => p.id);
    const { data: signals } = await supabase
      .from("signals")
      .select("*")
      .in("professional_id", proIds)
      .eq("verified", true)
      .order("created_at", { ascending: false });


    // Group signals by professional
    if (signals) {
      signals.forEach(signal => {
        const proId = signal.professional_id;
        if (proId) {
          if (!signalsByPro[proId]) signalsByPro[proId] = [];
          signalsByPro[proId].push(signal);
        }
      });
    }
  }

  const severityColors = {
    minor: "bg-kelen-yellow-50 text-kelen-yellow-700 border-kelen-yellow-200",
    major: "bg-orange-50 text-orange-700 border-orange-200",
    critical: "bg-kelen-red-50 text-kelen-red-700 border-kelen-red-200",
  };

  const breachTypeLabels = {
    timeline: "Retard / Délais",
    budget: "Dépassement budget",
    quality: "Qualité non conforme",
    abandonment: "Abandon de chantier",
    fraud: "Fraude / Arnaque",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-kelen-red-600" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste Noire</h1>
          <p className="text-sm text-muted-foreground">
            Professionnels bannis de la plateforme — Action admin requise
          </p>
        </div>
      </div>

      {/* Stats Hero Card */}
      <div className="rounded-xl border border-kelen-red-200 bg-kelen-red-50/50 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-kelen-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-kelen-red-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-kelen-red-700">
                {blacklistedPros?.length || 0}
              </p>
              <p className="text-sm text-kelen-red-600 font-medium">
                Professionnel{blacklistedPros?.length !== 1 ? 's' : ''} banni{blacklistedPros?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total signaux vérifiés</p>
            <p className="text-xl font-bold text-foreground">
              {blacklistedPros?.reduce((sum, pro) => sum + (pro.signal_count || 0), 0) || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Blacklisted Professionals List */}
      {blacklistedPros && blacklistedPros.length > 0 ? (
        <div className="space-y-8">
          {blacklistedPros.map((pro) => {
            const signals = signalsByPro[pro.id] || [];
            return (
              <div key={pro.id} className="rounded-xl border border-border bg-white overflow-hidden">
                {/* Professional Hero Card */}
                <div className="bg-gradient-to-r from-kelen-red-50 to-red-50/30 p-6 border-b border-border">
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white ring-2 ring-kelen-red-200 flex-shrink-0">
                      {pro.profile_picture_url ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={pro.profile_picture_url}
                            alt={pro.business_name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-kelen-red-400">
                          {pro.business_name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-foreground">
                            {pro.business_name}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pro.owner_name || 'Propriétaire inconnu'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-kelen-red-100 text-kelen-red-700 border border-kelen-red-200">
                            Liste Noire
                          </span>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          <span>{pro.category || 'Non catégorisé'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{pro.city ? `${pro.city}, ` : ''}{pro.country || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{pro.years_of_experience ? `${pro.years_of_experience} ans d'exp.` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-kelen-red-600 font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{pro.signal_count || 0} signal{pro.signal_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="mt-4">
                        <Link
                          href={`/professionnels/${pro.slug}`}
                          className="inline-flex items-center gap-2 text-sm text-kelen-green-600 hover:text-kelen-green-700 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Voir le profil complet
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signals List */}
                {signals.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                      Signaux vérifiés ({signals.length})
                    </h3>
                    <div className="space-y-4">
                      {signals.map((signal) => (
                        <div
                          key={signal.id}
                          className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${severityColors[signal.severity as keyof typeof severityColors] || severityColors.minor}`}>
                                {signal.severity === 'minor' ? 'Mineur' : signal.severity === 'major' ? 'Majeur' : 'Critique'}
                              </span>
                              <span className="text-sm font-semibold text-foreground">
                                {breachTypeLabels[signal.breach_type as keyof typeof breachTypeLabels] || signal.breach_type}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(signal.created_at)}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-foreground leading-relaxed mb-3">
                            {signal.breach_description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>Signalé par: {signal.submitter_name}</span>
                              {signal.submitter_country && (
                                <span>· {signal.submitter_country}</span>
                              )}
                            </div>
                            {signal.verified_at && (
                              <span>Vérifié le {formatDate(signal.verified_at)}</span>
                            )}
                          </div>

                          {/* Evidence URLs (if any) */}
                          {signal.evidence_urls && signal.evidence_urls.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Preuves ({signal.evidence_urls.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {signal.evidence_urls.slice(0, 3).map((url: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 bg-surface-container-low rounded text-xs text-kelen-green-600 hover:text-kelen-green-700 hover:underline truncate max-w-[200px]"
                                  >
                                    Preuve {idx + 1}
                                  </a>
                                ))}
                                {signal.evidence_urls.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{signal.evidence_urls.length - 3} autres
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-foreground">Aucun professionnel banni</p>
          <p className="text-sm text-muted-foreground mt-2">
            La liste noire est vide. Aucun professionnel n'a été banni de la plateforme.
          </p>
        </div>
      )}
    </div>
  );
}
