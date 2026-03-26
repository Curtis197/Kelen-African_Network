"use client";

import { useState } from "react";
import { UserRole } from "@/lib/supabase/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/format";
import {
  registerUserSchema,
  registerProfessionalSchema,
  type RegisterUserFormData,
  type RegisterProfessionalFormData,
} from "@/lib/utils/validators";
import { SUPPORTED_COUNTRIES, CATEGORIES, AFRICA_COUNTRIES, EUROPE_COUNTRIES } from "@/lib/utils/constants";

type RegisterMode = "client" | "professional";

interface RegisterFormProps {
  defaultMode?: RegisterMode;
  allowSwitch?: boolean;
}

export function RegisterForm({ defaultMode = "client", allowSwitch = true }: RegisterFormProps) {
  const [mode, setMode] = useState<RegisterMode>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const schema = mode === "client" ? registerUserSchema : registerProfessionalSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
  });

  const handleModeSwitch = (newMode: RegisterMode) => {
    setMode(newMode);
    setError(null);
    reset();
  };

  const getProRole = (country: string): UserRole => {
    if ((AFRICA_COUNTRIES as unknown as string[]).includes(country)) return "pro_africa";
    if ((EUROPE_COUNTRIES as unknown as string[]).includes(country)) return "pro_europe";
    return "pro_intl";
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const finalRole = mode === "client" ? "client" : getProRole(data.country);
      
      // 1. Sign up with Supabase Auth (Trigger handles user and pro creation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            role: finalRole,
            country: data.country,
            phone: data.phone || null,
            business_name: mode === "professional" ? data.business_name : null,
            category: mode === "professional" ? data.category : null,
            city: mode === "professional" ? data.city : null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      // 2. Check if email confirmation is required (session is null)
      if (authData.user && !authData.session) {
        setSuccess(true);
        return;
      }

      // 3. If session is returned (e.g. Email confirms disabled), redirect directly
      if (authData.user && authData.session) {
        if (mode === "professional") {
          router.push("/pro/dashboard");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const countries = SUPPORTED_COUNTRIES;

  if (success) {
    return (
      <div className="rounded-lg border border-kelen-green-200 bg-kelen-green-50 p-6 text-center shadow-sm">
        <h3 className="mb-2 text-lg font-bold text-kelen-green-800">Inscription réussie !</h3>
        <p className="text-kelen-green-700">
          Veuillez vérifier votre boîte mail. Un lien de confirmation vous a été envoyé pour activer votre compte.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mode toggle */}
      {allowSwitch && (
        <div className="mb-6 flex rounded-lg border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => handleModeSwitch("client")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "client"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Client
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
      )}

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
              <p className="mt-1 text-xs text-kelen-red-500">{errors.first_name.message?.toString()}</p>
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
              <p className="mt-1 text-xs text-kelen-red-500">{errors.last_name.message?.toString()}</p>
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
            <p className="mt-1 text-xs text-kelen-red-500">{errors.email.message?.toString()}</p>
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
            <p className="mt-1 text-xs text-kelen-red-500">{errors.password.message?.toString()}</p>
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
            <p className="mt-1 text-xs text-kelen-red-500">{errors.country.message?.toString()}</p>
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
                Nom de l&apos;entreprise / activité
              </label>
              <input
                id="business_name"
                type="text"
                {...register("business_name")}
                placeholder="Ex: Cabinet d&apos;avocats, Atelier XYZ, Boutique..."
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
              />
               {errors.business_name && (
                 <p className="mt-1 text-xs text-kelen-red-500">{errors.business_name.message?.toString()}</p>
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
                   <p className="mt-1 text-xs text-kelen-red-500">{errors.category.message?.toString()}</p>
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
                   <p className="mt-1 text-xs text-kelen-red-500">{errors.city.message?.toString()}</p>
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
                 <p className="mt-1 text-xs text-kelen-red-500">{errors.phone.message?.toString()}</p>
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
                 <p className="text-xs text-kelen-red-500">{errors.signal_understood.message?.toString()}</p>
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
                 <p className="text-xs text-kelen-red-500">{errors.privacy_accepted.message?.toString()}</p>
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
           <p className="text-xs text-kelen-red-500">{errors.terms_accepted.message?.toString()}</p>
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
