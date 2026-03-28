"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  recommendationSchema,
  type RecommendationFormData,
} from "@/lib/utils/validators";
import { BUDGET_RANGES } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import { uploadFile, uploadMultipleFiles, type UploadResult } from "@/lib/supabase/storage";

interface RecommendationFormProps {
  professionalId?: string;
  professionalName?: string;
  professionalSlug?: string;
  isExternal?: boolean;
}

export function RecommendationForm({
  professionalId,
  professionalName,
  professionalSlug,
  isExternal = false,
}: RecommendationFormProps) {
  const [step, setStep] = useState(0);
  // If external, we add a step at the beginning to identify the professional
  const effectiveIsExternal = isExternal || !professionalId;
  
  const STEPS = effectiveIsExternal 
    ? ["Professionnel", "Type de projet", "Détails du projet", "Budget & dates", "Pièces jointes", "Confirmation"]
    : ["Type de projet", "Détails du projet", "Budget & dates", "Pièces jointes", "Confirmation"];
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      professional_id: professionalId || null,
      external_name: "",
      external_category: "",
      external_city: "",
      external_country: "",
    },
  });

  const nextStep = async () => {
    const fieldsPerStep: (keyof RecommendationFormData)[][] = effectiveIsExternal
      ? [
          ["external_name", "external_category", "external_city", "external_country"],
          ["project_type"],
          ["project_description"],
          ["completion_date", "budget_range", "location"],
          [], // file step
          ["authenticity_confirmed"],
        ]
      : [
          ["project_type"],
          ["project_description"],
          ["completion_date", "budget_range", "location"],
          [], // file step
          ["authenticity_confirmed"],
        ];
    const isValid = await trigger(fieldsPerStep[step]);
    if (isValid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: RecommendationFormData) => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Vous devez être connecté pour soumettre une recommandation.");
        return;
      }

      // 2. Get user profile for metadata
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, country")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setError("Impossible de récupérer votre profil.");
        return;
      }

      // 3. Upload Files if any
      let contractUrl = "";
      let photoUrls: string[] = [];

      if (contractFile) {
        contractUrl = await uploadFile(contractFile, "contracts", `recommendations/${user.id}`);
      }

      if (photoFiles.length > 0) {
        const results: UploadResult[] = await uploadMultipleFiles(photoFiles, "evidence-photos", `recommendations/${user.id}`);
        const failed = results.filter((r) => r.error !== null);
        if (failed.length > 0) {
          throw new Error(failed.map((r) => r.error).join(", "));
        }
        photoUrls = results.map((r) => r.url as string);
      }

      // 4. Insert Recommendation
      const { error: insertError } = await supabase.from("recommendations").insert({
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
        project_type: data.project_type,
        project_description: data.project_description,
        completion_date: data.completion_date,
        budget_range: data.budget_range,
        location: data.location,
        contract_url: contractUrl,
        after_photos: photoUrls,
        status: "pending",
        verified: false,
        linked: !!data.professional_id,
      });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kelen-green-50">
          <span className="text-3xl text-kelen-green-500">✓</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Recommandation soumise
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Votre recommandation pour <strong>{professionalName || watch("external_name")}</strong> a été
          envoyée. Elle sera vérifiée par notre équipe avant publication.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href={professionalSlug ? `/pro/${professionalSlug}` : "/"}
            className="rounded-lg bg-kelen-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            {professionalSlug ? "Retour au profil" : "Retour à l'accueil"}
          </Link>
        </div>
      </div>
    );
  }

  // Helper for Link fallback since it's a client component
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
                  ? "bg-kelen-green-500 text-white"
                  : i === step
                    ? "bg-kelen-green-50 text-kelen-green-700 border border-kelen-green-500"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 min-w-[1rem] ${
                  i < step ? "bg-kelen-green-500" : "bg-border"
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
              Saisissez les informations du professionnel que vous souhaitez recommander.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Nom du professionnel ou de l'entreprise
                </label>
                <input
                  type="text"
                  {...register("external_name")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
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
                  Catégorie / Métier
                </label>
                <input
                  type="text"
                  {...register("external_category")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                  placeholder="Ex : Architecte, Maçon, Électricien..."
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
                  <input
                    type="text"
                    {...register("external_city")}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
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
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                    placeholder="Ex : Cameroun"
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

        {/* Project type */}
        {step === (effectiveIsExternal ? 1 : 0) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">
              Type de projet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quel type de projet avez-vous réalisé avec {professionalName || watch("external_name") || "ce professionnel"} ?
            </p>
            <div className="mt-4">
              <input
                type="text"
                {...register("project_type")}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                placeholder="Ex : Construction résidentielle, Rénovation, Installation électrique..."
              />
              {errors.project_type && (
                <p className="mt-1 text-xs text-kelen-red-500">
                  {errors.project_type.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Project description */}
        {step === (effectiveIsExternal ? 2 : 1) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">
              Détails du projet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Décrivez le projet réalisé et votre expérience.
            </p>
            <div className="mt-4">
              <textarea
                {...register("project_description")}
                rows={6}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                placeholder="Décrivez le projet, la qualité du travail, le respect des délais et du budget, la communication..."
              />
              {errors.project_description && (
                <p className="mt-1 text-xs text-kelen-red-500">
                  {errors.project_description.message}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Minimum 20 caractères
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {watch("project_description")?.length || 0} caractères
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget, dates, location */}
        {step === (effectiveIsExternal ? 3 : 2) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">
              Budget & dates
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informations complémentaires sur le projet.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Date de fin des travaux
                </label>
                <input
                  type="date"
                  {...register("completion_date")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                />
                {errors.completion_date && (
                  <p className="mt-1 text-xs text-kelen-red-500">
                    {errors.completion_date.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Fourchette budgétaire
                </label>
                <select
                  {...register("budget_range")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                >
                  <option value="">Sélectionner</option>
                  {BUDGET_RANGES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                {errors.budget_range && (
                  <p className="mt-1 text-xs text-kelen-red-500">
                    {errors.budget_range.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Lieu du projet
                </label>
                <input
                  type="text"
                  {...register("location")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                  placeholder="Ex : Cocody, Abidjan"
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-kelen-red-500">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Piece Jointes */}
        {step === (effectiveIsExternal ? 4 : 3) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">Pièces jointes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez des preuves de la réalisation du projet (contrat, factures, photos).
            </p>
            
            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Contrat ou Facture (PDF/Image)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className={`flex items-center gap-3 rounded-lg border border-dashed p-4 transition-colors ${contractFile ? "border-kelen-green-500 bg-kelen-green-50" : "border-border bg-muted/30 hover:bg-muted/50"}`}>
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
                  Photos du projet terminé
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className={`flex items-center gap-3 rounded-lg border border-dashed p-4 transition-colors ${photoFiles.length > 0 ? "border-kelen-green-500 bg-kelen-green-50" : "border-border bg-muted/30 hover:bg-muted/50"}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
                      {photoFiles.length > 0 ? "📸" : "📷"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {photoFiles.length > 0 ? `${photoFiles.length} photos sélectionnées` : "Cliquer pour uploader des photos"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Images (JPG, PNG), max 5 photos
                      </p>
                    </div>
                  </div>
                </div>
                {photoFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photoFiles.map((f, i) => (
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

        {/* Confirmation */}
        {step === (effectiveIsExternal ? 5 : 4) && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-lg font-semibold text-foreground">
              Confirmation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Relisez les informations et confirmez.
            </p>

            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Professionnel :</span>
                <span className="font-medium text-foreground">{professionalName || watch("external_name")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type de projet :</span>
                <span className="font-medium text-foreground">{watch("project_type")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lieu :</span>
                <span className="font-medium text-foreground">{watch("location")}</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register("authenticity_confirmed")}
                  className="mt-1 h-4 w-4 rounded border-border text-kelen-green-500 focus:ring-kelen-green-500/20 transition-all cursor-pointer"
                />
                <span className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                  Je confirme que les informations fournies sont authentiques et
                  basées sur une expérience réelle avec ce professionnel. Je
                  comprends que de fausses recommandations entraîneront la
                  suspension de mon compte.
                </span>
              </label>
              {errors.authenticity_confirmed && (
                <p className="mt-1 text-xs text-kelen-red-500 font-medium">
                  {errors.authenticity_confirmed.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:border-foreground/20"
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
              className="rounded-lg bg-kelen-green-500 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-kelen-green-600 shadow-sm active:scale-95"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-kelen-green-500 px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-kelen-green-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Envoi...
                </span>
              ) : (
                "Confirmer et envoyer"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
