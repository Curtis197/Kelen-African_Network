"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Bell,
  BellOff,
  Save,
  Loader2,
  Shield,
} from "lucide-react";
import { getUserProfile, updateUserProfile, type ProfileFormData } from "@/lib/actions/user-profile";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: "",
    country: "",
    phone: "",
    emailNotifications: true,
    language: "fr",
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getUserProfile();
      if (!result.success) {
        toast.error("Erreur lors du chargement du profil");
        return;
      }
      if (result.data) setFormData(result.data);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateUserProfile(formData);
      if (result.success) {
        toast.success("Profil mis à jour avec succès");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    });
  };

  const handleChange = (field: keyof ProfileFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-kelen-green-500" />
          <p className="text-sm font-medium text-muted-foreground italic">
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-kelen-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            Informations personnelles
          </h2>

          <div className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-2">
                Nom complet *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-container-lowest pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">
                Pays de résidence *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-container-lowest pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
                  placeholder="Ex: France, Sénégal, États-Unis"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-container-lowest pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground" />
            Préférences
          </h2>

          <div className="space-y-5">
            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-foreground mb-2">
                Langue
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-container-lowest pl-10 pr-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-border">
              <div className="flex items-start gap-3">
                {formData.emailNotifications ? (
                  <Bell className="w-5 h-5 text-kelen-green-600 mt-0.5" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications par email</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recevez des mises à jour sur vos projets et recommandations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange("emailNotifications", !formData.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.emailNotifications ? "bg-kelen-green-500" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.emailNotifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Read-only Email Info */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            Sécurité
          </h2>

          <div className="rounded-lg bg-surface-container-lowest border border-border p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Adresse email</p>
                <p className="text-sm font-medium text-foreground">
                  Cette information est gérée via votre compte d&apos;authentification
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-kelen-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-kelen-green-500/20 transition-all hover:bg-kelen-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
