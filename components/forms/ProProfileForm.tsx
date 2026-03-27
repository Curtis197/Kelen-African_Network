"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proProfileSchema, type ProProfileFormData } from "@/lib/utils/validators";
import { createClient } from "@/lib/supabase/client";

export function ProProfileForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [servicesInput, setServicesInput] = useState("");
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProProfileFormData>({
    resolver: zodResolver(proProfileSchema),
    defaultValues: {
      description: "",
      services_offered: [],
      years_experience: 0,
      team_size: 1,
      whatsapp: "",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching pro profile:", error);
    } else if (data) {
      reset({
        description: data.description || "",
        services_offered: data.services_offered || [],
        years_experience: data.years_experience || 0,
        team_size: data.team_size || 1,
        whatsapp: data.whatsapp || "",
      });
    }
    setIsLoading(false);
  };

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
    setIsSaving(true);
    setSaved(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("professionals")
        .update({
          description: data.description,
          services_offered: data.services_offered,
          years_experience: data.years_experience,
          team_size: data.team_size,
          whatsapp: data.whatsapp,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Erreur lors de la mise à jour du profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-24 bg-stone-100 rounded-xl w-full" />
        <div className="h-10 bg-stone-100 rounded-xl w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-stone-100 rounded-xl w-full" />
          <div className="h-10 bg-stone-100 rounded-xl w-full" />
        </div>
        <div className="h-12 bg-stone-200 rounded-xl w-full mt-8" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-kelen-green-500/20 bg-kelen-green-50 p-4 text-sm text-kelen-green-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Profil mis à jour avec succès.
        </div>
      )}

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-bold text-stone-900">
          À propos de votre activité
        </label>
        <textarea
          {...register("description")}
          rows={5}
          className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm transition-all placeholder:text-stone-400 focus:border-kelen-green-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-kelen-green-500/5"
          placeholder="Décrivez votre expertise, votre parcours et ce qui vous distingue..."
        />
        {errors.description && (
          <p className="mt-1.5 text-xs font-medium text-kelen-red-500">{errors.description.message?.toString()}</p>
        )}
        <div className="mt-2 flex justify-end">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${
            (watch("description")?.length || 0) > 300 ? 'text-kelen-red-500' : 'text-stone-400'
          }`}>
            {watch("description")?.length || 0} / 300 caractères
          </span>
        </div>
      </div>

      {/* Services */}
      <div>
        <label className="mb-2 block text-sm font-bold text-stone-900">
          Services & Spécialités
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
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm transition-all focus:border-kelen-green-500 focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5 placeholder:text-stone-400"
            placeholder="Ex: Construction Villa, Électricité Industrielle..."
          />
          <button
            type="button"
            onClick={addService}
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-stone-800 active:scale-95 shadow-lg shadow-stone-900/10"
          >
            Ajouter
          </button>
        </div>
        {services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {services.map((service) => (
              <span
                key={service}
                className="group flex items-center gap-2 rounded-full bg-stone-100 px-4 py-1.5 text-xs font-bold text-stone-600 border border-stone-200/50 hover:bg-stone-200 transition-colors"
              >
                {service}
                <button
                  type="button"
                  onClick={() => removeService(service)}
                  className="text-stone-400 hover:text-kelen-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm block">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Experience & Team */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-stone-900">
            Expérience (années)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-lg">history_edu</span>
            <input
              type="number"
              {...register("years_experience", { valueAsNumber: true })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-12 pr-4 py-3 text-sm transition-all focus:border-kelen-green-500 focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-stone-900">
            Équipe (personnes)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-lg">groups</span>
            <input
              type="number"
              {...register("team_size", { valueAsNumber: true })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-12 pr-4 py-3 text-sm transition-all focus:border-kelen-green-500 focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-stone-900">
          Numéro WhatsApp Professionnel
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-lg">smartphone</span>
          <input
            type="tel"
            {...register("whatsapp")}
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-12 pr-4 py-3 text-sm transition-all focus:border-kelen-green-500 focus:bg-white focus:ring-4 focus:ring-kelen-green-500/5"
            placeholder="+225 00 00 00 00 00"
          />
        </div>
        <p className="text-[10px] text-stone-400 font-medium px-1 italic">
          Les clients pourront vous contacter directement via WhatsApp depuis votre profil.
        </p>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-2xl bg-kelen-green-500 py-4 text-sm font-black text-white transition-all hover:bg-kelen-green-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-xl shadow-kelen-green-500/20 flex items-center justify-center gap-3"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              Mettre à jour mon profil pro
            </>
          )}
        </button>
      </div>
    </form>
  );
}
