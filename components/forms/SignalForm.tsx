"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signalSchema, type SignalFormData } from "@/lib/utils/validators";
import { BREACH_TYPES } from "@/lib/utils/constants";

interface SignalFormProps {
  professionalId: string;
  professionalName: string;
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

export function SignalForm({ professionalId, professionalName }: SignalFormProps) {
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
      [], // file upload step — no validation
      ["authenticity_confirmed", "false_signal_understood", "notification_understood"],
    ];
    const isValid = await trigger(fieldsPerStep[step]);
    if (isValid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: SignalFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with Supabase insert
      // const { error } = await supabase.from('signals').insert({
      //   ...data,
      //   submitter_id: session.user.id,
      //   status: 'pending',
      // });

      console.log("Signal submitted:", data);
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kelen-yellow-50">
          <span className="text-3xl">⚠</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Signal soumis</h2>
        <p className="mt-2 text-muted-foreground">
          Votre signal concernant <strong>{professionalName}</strong> a été
          enregistré. Il sera vérifié par notre équipe.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Le professionnel sera notifié et disposera de 15 jours pour répondre
          avant publication.
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
                className={`hidden h-0.5 w-6 sm:block ${
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

        <input type="hidden" {...register("professional_id")} />

        {/* Step 0: Breach type & severity */}
        {step === 0 && (
          <div>
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
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
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
                      className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        {...register("severity")}
                        className="mt-0.5 h-4 w-4 border-border text-kelen-red-500 focus:ring-kelen-red-500/20"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
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
          <div>
            <h2 className="text-lg font-semibold text-foreground">{STEPS[1]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Décrivez le manquement en détail. Plus votre description est
              précise, plus la vérification sera rapide.
            </p>
            <div className="mt-4">
              <textarea
                {...register("breach_description")}
                rows={8}
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                placeholder="Décrivez les faits de manière factuelle : ce qui était convenu, ce qui s'est passé, les conséquences..."
              />
              {errors.breach_description && (
                <p className="mt-1 text-xs text-kelen-red-500">
                  {errors.breach_description.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {watch("breach_description")?.length || 0} / 100 caractères minimum
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Dates & budget */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">{STEPS[2]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informations sur les délais et le budget convenus.
            </p>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Date de début convenue
                  </label>
                  <input
                    type="date"
                    {...register("agreed_start_date")}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                  />
                  {errors.agreed_start_date && (
                    <p className="mt-1 text-xs text-kelen-red-500">
                      {errors.agreed_start_date.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Date de fin convenue
                  </label>
                  <input
                    type="date"
                    {...register("agreed_end_date")}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
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
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
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
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                  placeholder="Ex : +15 000 € par rapport au devis"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: File upload */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">{STEPS[3]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajoutez des pièces justificatives pour accélérer la vérification
              (devis, contrats, photos, échanges...).
            </p>
            <div className="mt-4">
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Upload de fichiers disponible après connexion Supabase Storage
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Formats acceptés : JPG, PNG, PDF — Max 5 Mo par fichier — Max 10 fichiers
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Legal confirmation */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">{STEPS[4]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Veuillez lire et confirmer les engagements suivants.
            </p>

            <div className="mt-4 space-y-4">
              <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                <input
                  type="checkbox"
                  {...register("authenticity_confirmed")}
                  className="mt-0.5 h-4 w-4 rounded border-border text-kelen-red-500 focus:ring-kelen-red-500/20"
                />
                <span className="text-sm text-foreground">
                  Je confirme que les informations fournies sont authentiques et
                  basées sur une expérience réelle avec ce professionnel.
                </span>
              </label>
              {errors.authenticity_confirmed && (
                <p className="text-xs text-kelen-red-500">
                  {errors.authenticity_confirmed.message}
                </p>
              )}

              <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                <input
                  type="checkbox"
                  {...register("false_signal_understood")}
                  className="mt-0.5 h-4 w-4 rounded border-border text-kelen-red-500 focus:ring-kelen-red-500/20"
                />
                <span className="text-sm text-foreground">
                  Je comprends qu&apos;un faux signal entraînera la suspension
                  définitive de mon compte et d&apos;éventuelles poursuites
                  judiciaires.
                </span>
              </label>
              {errors.false_signal_understood && (
                <p className="text-xs text-kelen-red-500">
                  {errors.false_signal_understood.message}
                </p>
              )}

              <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                <input
                  type="checkbox"
                  {...register("notification_understood")}
                  className="mt-0.5 h-4 w-4 rounded border-border text-kelen-red-500 focus:ring-kelen-red-500/20"
                />
                <span className="text-sm text-foreground">
                  Je comprends que le professionnel sera notifié de ce signal et
                  disposera de 15 jours pour y répondre avant publication sur
                  son profil.
                </span>
              </label>
              {errors.notification_understood && (
                <p className="text-xs text-kelen-red-500">
                  {errors.notification_understood.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
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
              className="rounded-lg bg-kelen-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-red-600"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-kelen-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Envoi en cours..." : "Soumettre le signal"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
