"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proProfileSchema, type ProProfileFormData } from "@/lib/utils/validators";

// Demo data
const DEMO_PROFILE = {
  description:
    "Construction résidentielle et rénovation à Abidjan depuis 2009. Spécialisé dans les projets de la diaspora.",
  services_offered: ["Construction neuve", "Rénovation complète", "Extension", "Gros œuvre"],
  years_experience: 15,
  team_size: 12,
  whatsapp: "+225 07 00 00 00",
};

export function ProProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [servicesInput, setServicesInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProProfileFormData>({
    resolver: zodResolver(proProfileSchema),
    defaultValues: DEMO_PROFILE,
  });

  const services = watch("services_offered") || [];

  const addService = () => {
    const trimmed = servicesInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setValue("services_offered", [...services, trimmed]);
      setServicesInput("");
    }
  };

  const removeService = (service: string) => {
    setValue(
      "services_offered",
      services.filter((s) => s !== service)
    );
  };

  const onSubmit = async (data: ProProfileFormData) => {
    setIsLoading(true);
    setSaved(false);

    try {
      // TODO: Replace with Supabase update
      // const { error } = await supabase
      //   .from('professionals')
      //   .update(data)
      //   .eq('id', session.user.id);

      console.log("Profile updated:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {saved && (
        <div className="rounded-lg border border-kelen-green-500/20 bg-kelen-green-50 p-3 text-sm text-kelen-green-700">
          Profil mis à jour avec succès.
        </div>
      )}

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          placeholder="Décrivez votre activité..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-kelen-red-500">{errors.description.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {watch("description")?.length || 0} / 300
        </p>
      </div>

      {/* Services */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Services proposés
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={servicesInput}
            onChange={(e) => setServicesInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addService();
              }
            }}
            className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            placeholder="Ajouter un service..."
          />
          <button
            type="button"
            onClick={addService}
            className="rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600"
          >
            Ajouter
          </button>
        </div>
        {services.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {services.map((service) => (
              <span
                key={service}
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-foreground/70"
              >
                {service}
                <button
                  type="button"
                  onClick={() => removeService(service)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Experience & Team */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Années d&apos;expérience
          </label>
          <input
            type="number"
            {...register("years_experience", { valueAsNumber: true })}
            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Taille de l&apos;équipe
          </label>
          <input
            type="number"
            {...register("team_size", { valueAsNumber: true })}
            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          WhatsApp
        </label>
        <input
          type="tel"
          {...register("whatsapp")}
          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
          placeholder="+225 07 00 00 00"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-kelen-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-kelen-green-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
