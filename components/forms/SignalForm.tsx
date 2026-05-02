"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signalSchema, type SignalFormData } from "@/lib/utils/validators";
import { BREACH_TYPES } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, uploadMultipleFiles, type UploadResult } from "@/lib/supabase/storage";
import { LocationSearch, type LocationData } from "@/components/location/LocationSearch";

interface SignalFormProps {
  professionalId?: string;
  professionalName?: string;
  professionalSlug?: string;
  isExternal?: boolean;
}

const STEPS = [
  "Type de manquement",
  "Description",
  "Dates & budget",
  "PiÃ¨ces jointes",
  "Engagement lÃ©gal",
];

const SEVERITY_OPTIONS = [
  {
    value: "minor",
    label: "Mineur",
    description: "Retard limitÃ©, Ã©cart budgÃ©taire faible, dÃ©faut mineur",
  },
  {
    value: "major",
    label: "Majeur",
    description: "Retard significatif, dÃ©passement important, dÃ©fauts multiples",
  },
  {
    value: "critical",
    label: "Critique",
    description: "Abandon de chantier, fraude, malfaÃ§ons graves",
  },
];

export function SignalForm({
  professionalId,
  professionalName,
  professionalSlug,
  isExternal = false,
}: SignalFormProps) {
  const [step, setStep] = useState(0);
  const effectiveIsExternal = isExternal || !professionalId;

  const STEPS = effectiveIsExternal
    ? [
        "Professionnel",
        "Type de manquement",
        "Description",
        "Dates & budget",
        "PiÃ¨ces jointes",
        "Engagement lÃ©gal",
      ]
    : [
        "Type de manquement",
        "Description",
        "Dates & budget",
        "PiÃ¨ces jointes",
        "Engagement lÃ©gal",
      ];
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
    setValue,
  } = useForm<SignalFormData>({
    resolver: zodResolver(signalSchema),
    defaultValues: {
      professional_id: professionalId || null,
      external_name: "",
      external_category: "",
      external_city: "",
      external_country: "",
    },
  });

  const nextStep = async () => {
    const fieldsPerStep: (keyof SignalFormData)[][] = effectiveIsExternal
      ? [
          ["external_name", "external_category", "external_city", "external_country"],
          ["breach_type", "severity"],
          ["breach_description"],
          ["agreed_start_date", "agreed_end_date"],
          [], // file upload step
          [
            "authenticity_confirmed",
            "false_signal_understood",
            "notification_understood",
          ],
        ]
      : [
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
        setError("Vous devez Ãªtre connectÃ© pour soumettre un signal.");
        return;
      }

      // 2. Get user profile
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, country")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setError("Impossible de rÃ©cupÃ©rer votre profil.");
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
        const evidenceResults: UploadResult[] = await uploadMultipleFiles(evidenceFiles, "evidence-photos", `signals/${user.id}`);
        const failedEvidence = evidenceResults.filter((r) => r.error !== null);
        if (failedEvidence.length > 0) {
          throw new Error(failedEvidence.map((r) => r.error).join(", "));
        }
        evidenceUrls = evidenceResults.map((r) => r.url as string);
      }

      if (logFiles.length > 0) {
        const logResults: UploadResult[] = await uploadMultipleFiles(logFiles, "evidence-photos", `signals/${user.id}/logs`);
        const failedLogs = logResults.filter((r) => r.error !== null);
        if (failedLogs.length > 0) {
          throw new Error(failedLogs.map((r) => r.error).join(", "));
        }
        logUrls = logResults.map((r) => r.url as string);
      }

      // 4. Insert Signal
      const { error: insertError } = await supabase.from("signals").insert({
        professional_id: data.professional_id || null,
        professional_slug: professionalSlug || null,
        external_name: data.external_name || null,
        external_category: data.external_category || null,
        external_city: data.external_city || null,
        external_country: data.external_country || null,
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
      setError("Une erreur est survenue lors de l'envoi. Veuillez rÃ©essayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kelen-yellow-50">
          <span className="text-3xl">âš </span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Signal soumis</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Votre signal concernant <strong>{professionalName || watch("external_name")}</strong> a Ã©tÃ©
          enregistrÃ©. Il sera vÃ©rifiÃ©e par notre Ã©quipe.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Le professionnel sera notifiÃ© et disposera de 15 jours pour rÃ©pondre
          avant publication.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href={professionalSlug ? `/pro/${professionalSlug}` : "/"}
            className="rounded-lg bg-kelen-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            {professionalSlug ? "Retour au profil" : "Retour Ã  l'accueil"}
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
              {i < step ? "âœ“" : i + 1}
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

        {/* Step 0: External Professional Identity (Only if external) */}
        {effectiveIsExternal && step === 0 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">
              Identifier le professionnel
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saisissez les informations du professionnel que vous souhaitez signaler.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nom du professionnel ou de l'entreprise
                </label>
                <input
                  type="text"
                  {...register("external_name")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                  placeholder="Ex : Jean Dupont ou SABC Construction"
                />
                {errors.external_name && (
                  <p className="mt-1 text-xs text-kelen-red-500">
                    {errors.external_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  CatÃ©gorie / MÃ©tier
                </label>
                <input
                  type="text"
                  {...register("external_category")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                  placeholder="Ex : Architecte, MaÃ§on, Ã‰lectricien..."
                />
                {errors.external_category && (
                  <p className="mt-1 text-xs text-kelen-red-500">
                    {errors.external_category.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Ville
                  </label>
                  <LocationSearch
                    value={watch("external_city") ? { name: watch("external_city") || "", formatted_address: watch("external_city") || "", lat: 0, lng: 0 } : null}
                    onChange={(loc: LocationData | null) => {
                      setValue("external_city", loc?.city || "");
                      if (loc?.country) setValue("external_country", loc.country);
                    }}
                    placeholder="Ex : Douala"
                  />
                  {errors.external_city && (
                    <p className="mt-1 text-xs text-kelen-red-500">
                      {errors.external_city.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Pays
                  </label>
                  <input
                    type="text"
                    {...register("external_country")}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20 placeholder:text-muted-foreground"
                    placeholder="Ex : Cameroun"
                    readOnly
                  />
                  {errors.external_country && (
                    <p className="mt-1 text-xs text-kelen-red-500">
                      {errors.external_country.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Breach type & severity */}
        {step === (effectiveIsExternal ? 1 : 0) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">Type de manquement</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quel type de manquement souhaitez-vous signaler concernant {professionalName || watch("external_name") || "ce professionnel"} ?
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
                  <option value="">SÃ©lectionner</option>
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
                  GravitÃ©
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

        {/* Description */}
        {step === (effectiveIsExternal ? 2 : 1) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">Description</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              DÃ©crivez le manquement en dÃ©tail. Plus votre description est
              prÃ©cise, plus la vÃ©rification sera rapide.
            </p>
            <div className="mt-4">
              <textarea
                {...register("breach_description")}
                rows={8}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                placeholder="DÃ©crivez les faits de maniÃ¨re factuelle : ce qui Ã©tait convenu, ce qui s'est passÃ©, les consÃ©quences..."
              />
              {errors.breach_description && (
                <p className="mt-1 text-xs text-kelen-red-500">
                  {errors.breach_description.message}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Minimum 100 caractÃ¨res
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {watch("breach_description")?.length || 0} caractÃ¨res
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dates & budget */}
        {step === (effectiveIsExternal ? 3 : 2) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">Dates & budget</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informations sur les dÃ©lais et le budget convenus.
            </p>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    DÃ©marrage convenu
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
                  Ã‰cart de dÃ©lai (optionnel)
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
                  Ã‰cart budgÃ©taire (optionnel)
                </label>
                <input
                  type="text"
                  {...register("budget_deviation")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-red-500 focus:outline-none focus:ring-2 focus:ring-kelen-red-500/20"
                  placeholder="Ex : +15 000 â‚¬ par rapport au devis"
                />
              </div>
            </div>
          </div>
        )}

        {/* File upload */}
        {step === (effectiveIsExternal ? 4 : 3) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">PiÃ¨ces jointes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez des piÃ¨ces justificatives (contrat, factures, photos, Ã©changes...).
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
                      {contractFile ? "ðŸ“„" : "ðŸ“"}
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
                  Photos des malfaÃ§ons / Preuves visuelles
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
                      {evidenceFiles.length > 0 ? "ðŸ“¸" : "ðŸ“·"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {evidenceFiles.length > 0 ? `${evidenceFiles.length} photos sÃ©lectionnÃ©es` : "Cliquer pour uploader des photos"}
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
                  Ã‰changes (WhatsApp, Email screenshots)
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
                      {logFiles.length > 0 ? "ðŸ’¬" : "ðŸ“§"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {logFiles.length > 0 ? `${logFiles.length} fichiers sÃ©lectionnÃ©s` : "Cliquer pour uploader des captures"}
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

        {/* Legal confirmation */}
        {step === (effectiveIsExternal ? 5 : 4) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">Engagement lÃ©gal</h2>
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
                  basÃ©es sur une expÃ©rience rÃ©elle avec ce professionnel.
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
                  Je comprends qu&apos;un faux signal entraÃ®nera la suspension
                  dÃ©finitive de mon compte et d&apos;Ã©ventuelles poursuites
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
                  Je comprends que le professionnel sera notifiÃ© de ce signal et
                  disposera de 15 jours pour y rÃ©pondre avant publication sur
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
              PrÃ©cÃ©dent
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
