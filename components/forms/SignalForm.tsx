"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signalSchema, type SignalFormData } from "@/lib/utils/validators";
import { BREACH_TYPES } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, uploadMultipleFiles } from "@/lib/supabase/storage";

interface SignalFormProps {
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
}

const STEPS = [
  "Type de manquement",
  "Description",
  "Dates & budget",
  "Pièces jointes",
  "Engagement légal",
];

const SEVERITY_OPTIONS = [
  {
    value: "minor",
    label: "Mineur",
    description: "Retard limité, écart budgétaire faible, défaut mineur",
  },
  {
    value: "major",
    label: "Majeur",
    description: "Retard significatif, dépassement important, défauts multiples",
  },
  {
    value: "critical",
    label: "Critique",
    description: "Abandon de chantier, fraude, malfaçons graves",
  },
];

export function SignalForm({
  professionalId,
  professionalName,
  professionalSlug,
}: SignalFormProps) {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [logFiles, setLogFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<SignalFormData>({
    resolver: zodResolver(signalSchema),
    defaultValues: {
      professional_id: professionalId,
    },
  });

  const nextStep = async () => {
    const fieldsPerStep: (keyof SignalFormData)[][] = [
      ["breach_type", "severity"],
      ["breach_description"],
      ["agreed_start_date", "agreed_end_date"],
      [], // file upload step
      [
        "authenticity_confirmed",
        "false_signal_understood",
        "notification_understood",
      ],
    ];
    const isValid = await trigger(fieldsPerStep[step]);
    if (isValid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: SignalFormData) => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Vous devez être connecté pour soumettre un signal.");
        return;
      }

      // 2. Get user profile
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, country")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setError("Impossible de récupérer votre profil.");
        return;
      }

      // 3. Upload Files
      let contractUrl = "";
      let evidenceUrls: string[] = [];
      let logUrls: string[] = [];

      if (contractFile) {
        contractUrl = await uploadFile(contractFile, "contracts", `signals/${user.id}`);
      }

      if (evidenceFiles.length > 0) {
        evidenceUrls = await uploadMultipleFiles(evidenceFiles, "evidence-photos", `signals/${user.id}`);
      }

      if (logFiles.length > 0) {
        logUrls = await uploadMultipleFiles(logFiles, "evidence-photos", `signals/${user.id}/logs`);
      }

      // 4. Insert Signal
      const { error: insertError } = await supabase.from("signals").insert({
        professional_id: professionalId,
        professional_slug: professionalSlug,
        submitter_id: user.id,
        submitter_name: `${profile.first_name} ${profile.last_name}`,
        submitter_country: profile.country,
        submitter_email: user.email!,
        breach_type: data.breach_type,
        breach_description: data.breach_description,
        severity: data.severity,
        agreed_start_date: data.agreed_start_date,
        agreed_end_date: data.agreed_end_date,
        timeline_deviation: data.timeline_deviation,
        budget_deviation: data.budget_deviation,
        contract_url: contractUrl,
        evidence_urls: evidenceUrls,
        communication_logs: logUrls,
        status: "pending",
        verified: false,
      });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      console.error("Signal submission error:", err);
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kelen-yellow-50">
          <span className="text-3xl">⚠</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Signal soumis</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Votre signal concernant <strong>{professionalName}</strong> a été
          enregistré. Il sera vérifié par notre équipe.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Le professionnel sera notifié et disposera de 15 jours pour répondre
          avant publication.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href={`/pro/${professionalSlug}`}
            className="rounded-lg bg-kelen-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            Retour au profil
          </Link>
        </div>
      </div>
    );
  }

  // Link fallback
  function Link({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i < step
                  ? "bg-kelen-red-500 text-white"
                  : i === step
                    ? "bg-kelen-red-50 text-kelen-red-700 border border-kelen-red-500"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 min-w-[1rem] ${
                  i < step ? "bg-kelen-red-500" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-kelen-red-500/20 bg-kelen-red-50 p-3 text-sm text-kelen-red-700">
            {error}
          </div>
        )}

        {/* Step 0: Breach type & severity */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">{STEPS[0]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quel type de manquement souhaitez-vous signaler ?
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Type de manquement
                </label>
                <select
                  {...register("breach_type")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                >
                  <option value="">Sélectionner</option>
                  {BREACH_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                {errors.breach_type && (
                  <p className="mt-1 text-xs text-kelen-red-500">
                    {errors.breach_type.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Gravité
                </label>
                <div className="space-y-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 transition-all hover:bg-muted/50 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        {...register("severity")}
                        className="mt-1 h-4 w-4 border-border text-kelen-red-500 focus:ring-kelen-red-500/20 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-kelen-red-700 transition-colors">
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.severity && (
                  <p className="mt-1 text-xs text-kelen-red-500">
                    {errors.severity.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Description */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">{STEPS[1]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Décrivez le manquement en détail. Plus votre description est
              précise, plus la vérification sera rapide.
            </p>
            <div className="mt-4">
              <textarea
                {...register("breach_description")}
                rows={8}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                placeholder="Décrivez les faits de manière factuelle : ce qui était convenu, ce qui s'est passé, les conséquences..."
              />
              {errors.breach_description && (
                <p className="mt-1 text-xs text-kelen-red-500">
                  {errors.breach_description.message}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Minimum 100 caractères
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {watch("breach_description")?.length || 0} caractères
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates & budget */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">{STEPS[2]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informations sur les délais et le budget convenus.
            </p>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Démarrage convenu
                  </label>
                  <input
                    type="date"
                    {...register("agreed_start_date")}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                  />
                  {errors.agreed_start_date && (
                    <p className="mt-1 text-xs text-kelen-red-500">
                      {errors.agreed_start_date.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Fin convenue
                  </label>
                  <input
                    type="date"
                    {...register("agreed_end_date")}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                  />
                  {errors.agreed_end_date && (
                    <p className="mt-1 text-xs text-kelen-red-500">
                      {errors.agreed_end_date.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Écart de délai (optionnel)
                </label>
                <input
                  type="text"
                  {...register("timeline_deviation")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                  placeholder="Ex : 3 mois de retard"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Écart budgétaire (optionnel)
                </label>
                <input
                  type="text"
                  {...register("budget_deviation")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                  placeholder="Ex : +15 000 € par rapport au devis"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: File upload */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">{STEPS[3]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez des pièces justificatives (contrat, factures, photos, échanges...).
            </p>
            
            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Contrat initial (obligatoire)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className={`flex items-center gap-3 rounded-lg border border-dashed p-4 transition-colors ${contractFile ? "border-kelen-red-500 bg-kelen-red-50" : "border-border bg-muted/30 hover:bg-muted/50"}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
                      {contractFile ? "📄" : "📁"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {contractFile ? contractFile.name : "Cliquer pour uploader le contrat"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF ou Image, max 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Photos des malfaçons / Preuves visuelles
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className={`flex items-center gap-3 rounded-lg border border-dashed p-4 transition-colors ${evidenceFiles.length > 0 ? "border-kelen-red-500 bg-kelen-red-50" : "border-border bg-muted/30 hover:bg-muted/50"}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
                      {evidenceFiles.length > 0 ? "📸" : "📷"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {evidenceFiles.length > 0 ? `${evidenceFiles.length} photos sélectionnées` : "Cliquer pour uploader des photos"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Images (JPG, PNG), max 10 photos
                      </p>
                    </div>
                  </div>
                </div>
                {evidenceFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {evidenceFiles.map((f, i) => (
                      <div key={i} className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                        {f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Échanges (WhatsApp, Email screenshots)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setLogFiles(Array.from(e.target.files || []))}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className={`flex items-center gap-3 rounded-lg border border-dashed p-4 transition-colors ${logFiles.length > 0 ? "border-kelen-red-500 bg-kelen-red-50" : "border-border bg-muted/30 hover:bg-muted/50"}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
                      {logFiles.length > 0 ? "💬" : "📧"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {logFiles.length > 0 ? `${logFiles.length} fichiers sélectionnés` : "Cliquer pour uploader des captures"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Images, max 10 fichiers
                      </p>
                    </div>
                  </div>
                </div>
                {logFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {logFiles.map((f, i) => (
                      <div key={i} className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                        {f.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Legal confirmation */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">{STEPS[4]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Veuillez lire et confirmer les engagements suivants.
            </p>

            <div className="mt-6 space-y-4">
              <label className="flex items-start gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors group">
                <input
                  type="checkbox"
                  {...register("authenticity_confirmed")}
                  className="mt-1 h-4 w-4 rounded border-border text-kelen-red-500 focus:ring-kelen-red-500/20 cursor-pointer"
                />
                <span className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground">
                  Je confirme que les informations fournies sont authentiques et
                  basées sur une expérience réelle avec ce professionnel.
                </span>
              </label>
              {errors.authenticity_confirmed && (
                <p className="text-xs text-kelen-red-500 font-medium px-4">
                  {errors.authenticity_confirmed.message}
                </p>
              )}

              <label className="flex items-start gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors group">
                <input
                  type="checkbox"
                  {...register("false_signal_understood")}
                  className="mt-1 h-4 w-4 rounded border-border text-kelen-red-500 focus:ring-kelen-red-500/20 cursor-pointer"
                />
                <span className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground">
                  Je comprends qu&apos;un faux signal entraînera la suspension
                  définitive de mon compte et d&apos;éventuelles poursuites
                  judiciaires.
                </span>
              </label>
              {errors.false_signal_understood && (
                <p className="text-xs text-kelen-red-500 font-medium px-4">
                  {errors.false_signal_understood.message}
                </p>
              )}

              <label className="flex items-start gap-4 rounded-xl border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors group">
                <input
                  type="checkbox"
                  {...register("notification_understood")}
                  className="mt-1 h-4 w-4 rounded border-border text-kelen-red-500 focus:ring-kelen-red-500/20 cursor-pointer"
                />
                <span className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground">
                  Je comprends que le professionnel sera notifié de ce signal et
                  disposera de 15 jours pour y répondre avant publication sur
                  son profil.
                </span>
              </label>
              {errors.notification_understood && (
                <p className="text-xs text-kelen-red-500 font-medium px-4">
                  {errors.notification_understood.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
            >
              Précédent
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-lg bg-kelen-red-500 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-kelen-red-600 shadow-sm active:scale-95"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-kelen-red-500 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-kelen-red-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Envoi...
                </span>
              ) : (
                "Confirmer et soumettre"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
