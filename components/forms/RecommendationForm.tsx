"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  recommendationSchema,
  type RecommendationFormData,
} from "@/lib/utils/validators";
import { BUDGET_RANGES } from "@/lib/utils/constants";

interface RecommendationFormProps {
  professionalId: string;
  professionalName: string;
}

const STEPS = [
  "Type de projet",
  "Détails du projet",
  "Budget & dates",
  "Confirmation",
];

export function RecommendationForm({
  professionalId,
  professionalName,
}: RecommendationFormProps) {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      professional_id: professionalId,
    },
  });

  const nextStep = async () => {
    const fieldsPerStep: (keyof RecommendationFormData)[][] = [
      ["project_type"],
      ["project_description"],
      ["completion_date", "budget_range", "location"],
      ["authenticity_confirmed"],
    ];
    const isValid = await trigger(fieldsPerStep[step]);
    if (isValid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: RecommendationFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with Supabase insert
      // const { error } = await supabase.from('recommendations').insert({
      //   ...data,
      //   submitter_id: session.user.id,
      //   status: 'pending',
      // });

      console.log("Recommendation submitted:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
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
        <p className="mt-2 text-muted-foreground">
          Votre recommandation pour <strong>{professionalName}</strong> a été
          envoyée. Elle sera vérifiée par notre équipe avant publication.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Délai de vérification : 48-72 heures
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
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
                className={`hidden h-0.5 w-8 sm:block ${
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

        <input type="hidden" {...register("professional_id")} />

        {/* Step 0: Project type */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {STEPS[0]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quel type de projet avez-vous réalisé avec {professionalName} ?
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

        {/* Step 1: Project description */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {STEPS[1]}
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
              <p className="mt-1 text-xs text-muted-foreground">
                {watch("project_description")?.length || 0} / 20 caractères minimum
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Budget, dates, location */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {STEPS[2]}
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

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {STEPS[3]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Relisez les informations et confirmez.
            </p>

            {/* Summary */}
            <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4 space-y-2 text-sm">
              <p>
                <span className="font-medium">Professionnel :</span>{" "}
                {professionalName}
              </p>
              <p>
                <span className="font-medium">Type de projet :</span>{" "}
                {watch("project_type")}
              </p>
              <p>
                <span className="font-medium">Lieu :</span>{" "}
                {watch("location")}
              </p>
            </div>

            <div className="mt-4">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...register("authenticity_confirmed")}
                  className="mt-0.5 h-4 w-4 rounded border-border text-kelen-green-500 focus:ring-kelen-green-500/20"
                />
                <span className="text-sm text-muted-foreground">
                  Je confirme que les informations fournies sont authentiques et
                  basées sur une expérience réelle avec ce professionnel. Je
                  comprends que de fausses recommandations entraîneront la
                  suspension de mon compte.
                </span>
              </label>
              {errors.authenticity_confirmed && (
                <p className="mt-1 text-xs text-kelen-red-500">
                  {errors.authenticity_confirmed.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
              className="rounded-lg bg-kelen-green-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-kelen-green-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Envoi en cours..." : "Soumettre la recommandation"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
