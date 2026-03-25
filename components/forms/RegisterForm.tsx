"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerUserSchema,
  registerProfessionalSchema,
  type RegisterUserFormData,
  type RegisterProfessionalFormData,
} from "@/lib/utils/validators";
import { DIASPORA_COUNTRIES, COUNTRIES, CATEGORIES } from "@/lib/utils/constants";

type RegisterMode = "diaspora" | "professional";

export function RegisterForm() {
  const [mode, setMode] = useState<RegisterMode>("diaspora");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = mode === "diaspora" ? registerUserSchema : registerProfessionalSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterProfessionalFormData>({
    resolver: zodResolver(schema),
  });

  const handleModeSwitch = (newMode: RegisterMode) => {
    setMode(newMode);
    setError(null);
    reset();
  };

  const onSubmit = async (data: RegisterUserFormData | RegisterProfessionalFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with Supabase auth
      // const { error } = await supabase.auth.signUp({
      //   email: data.email,
      //   password: data.password,
      //   options: { data: { first_name: data.first_name, last_name: data.last_name, ... } }
      // });
      // Then insert into users/professionals table
      // router.push('/dashboard');

      console.log("Register attempt:", data.email, mode);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setError("Inscription Supabase non configurée. Backend en cours de développement.");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const countries = mode === "diaspora"
    ? [...DIASPORA_COUNTRIES, ...COUNTRIES]
    : [...COUNTRIES, ...DIASPORA_COUNTRIES];

  return (
    <div>
      {/* Mode toggle */}
      <div className="mb-6 flex rounded-lg border border-border bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => handleModeSwitch("diaspora")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "diaspora"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Diaspora
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch("professional")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "professional"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Professionnel
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-kelen-red-500/20 bg-kelen-red-50 p-3 text-sm text-kelen-red-700">
            {error}
          </div>
        )}

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="mb-1.5 block text-sm font-medium text-foreground">
              Prénom
            </label>
            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              {...register("first_name")}
              className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-kelen-red-500">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="last_name" className="mb-1.5 block text-sm font-medium text-foreground">
              Nom
            </label>
            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              {...register("last_name")}
              className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-kelen-red-500">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-foreground">
            Adresse email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            placeholder="vous@exemple.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-kelen-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            placeholder="8 caractères minimum"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-kelen-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-foreground">
            Pays de résidence
          </label>
          <select
            id="country"
            {...register("country")}
            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          >
            <option value="">Sélectionner un pays</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-xs text-kelen-red-500">{errors.country.message}</p>
          )}
        </div>

        {/* Professional-only fields */}
        {mode === "professional" && (
          <>
            <hr className="border-border" />
            <p className="text-sm font-medium text-foreground">Informations professionnelles</p>

            {/* Business name */}
            <div>
              <label htmlFor="business_name" className="mb-1.5 block text-sm font-medium text-foreground">
                Nom de l&apos;entreprise
              </label>
              <input
                id="business_name"
                type="text"
                {...register("business_name")}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
              />
              {errors.business_name && (
                <p className="mt-1 text-xs text-kelen-red-500">{errors.business_name.message}</p>
              )}
            </div>

            {/* Category + City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-foreground">
                  Catégorie
                </label>
                <select
                  id="category"
                  {...register("category")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                >
                  <option value="">Choisir</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-kelen-red-500">{errors.category.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-foreground">
                  Ville
                </label>
                <input
                  id="city"
                  type="text"
                  {...register("city")}
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                  placeholder="Abidjan, Dakar..."
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-kelen-red-500">{errors.city.message}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                {...register("phone")}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
                placeholder="+225 07 00 00 00"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-kelen-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Pro checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...register("signal_understood")}
                  className="mt-0.5 h-4 w-4 rounded border-border text-kelen-green-500 focus:ring-kelen-green-500/20"
                />
                <span className="text-xs text-muted-foreground">
                  Je comprends que tout manquement contractuel documenté peut faire l&apos;objet
                  d&apos;un signalement vérifié sur mon profil public.
                </span>
              </label>
              {errors.signal_understood && (
                <p className="text-xs text-kelen-red-500">{errors.signal_understood.message}</p>
              )}

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...register("privacy_accepted")}
                  className="mt-0.5 h-4 w-4 rounded border-border text-kelen-green-500 focus:ring-kelen-green-500/20"
                />
                <span className="text-xs text-muted-foreground">
                  J&apos;accepte la{" "}
                  <a href="/confidentialite" className="text-kelen-green-600 underline">
                    politique de confidentialité
                  </a>
                  .
                </span>
              </label>
              {errors.privacy_accepted && (
                <p className="text-xs text-kelen-red-500">{errors.privacy_accepted.message}</p>
              )}
            </div>
          </>
        )}

        {/* Terms checkbox (both modes) */}
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            {...register("terms_accepted")}
            className="mt-0.5 h-4 w-4 rounded border-border text-kelen-green-500 focus:ring-kelen-green-500/20"
          />
          <span className="text-xs text-muted-foreground">
            J&apos;accepte les{" "}
            <a href="/cgu" className="text-kelen-green-600 underline">
              conditions générales d&apos;utilisation
            </a>
            .
          </span>
        </label>
        {errors.terms_accepted && (
          <p className="text-xs text-kelen-red-500">{errors.terms_accepted.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Création en cours..." : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
