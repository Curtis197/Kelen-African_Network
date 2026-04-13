"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProProject } from "@/lib/actions/pro-projects";
import type { ProProjectFormData, ProProjectStatus } from "@/lib/types/pro-projects";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProjectPhotoUpload } from "./ProjectPhotoUpload";
import { LocationSearch, type LocationData } from "@/components/location/LocationSearch";

const CATEGORIES = [
  "construction",
  "renovation",
  "plomberie",
  "electricite",
  "menuiserie",
  "peinture",
  "maconnerie",
  "jardinage",
  "autre",
];

export function ProProjectForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProProjectFormData>({
    title: "",
    description: "",
    category: "construction",
    location: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    start_date: "",
    end_date: "",
    budget: 0,
    currency: "XOF",
    status: "in_progress",
    is_public: false,
    completion_notes: "",
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const updateField = <K extends keyof ProProjectFormData>(field: K, value: ProProjectFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);
    const result = await createProProject(formData, imageUrls);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Projet créé");
      router.push(`/pro/projets/${result.data?.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-surface-container transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Nouveau projet</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Créez un projet pour documenter votre travail
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-on-surface">Informations du projet</h3>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-on-surface-variant mb-2">
              Titre du projet *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Ex: Construction villa Saly"
              maxLength={200}
              required
              className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-on-surface-variant mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Décrivez le projet..."
              maxLength={2000}
              className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-on-surface-variant mb-2">
                Catégorie
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-on-surface-variant mb-2">
                Lieu
              </label>
              <LocationSearch
                value={formData.location ? { name: formData.location, formatted_address: formData.location, lat: 0, lng: 0 } : null}
                onChange={(loc: LocationData | null) => updateField("location", loc?.formatted_address || "")}
                placeholder="Ex: Dakar, Senegal"
              />
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-on-surface">
            Informations client <span className="text-on-surface-variant/60 font-normal">(optionnel)</span>
          </h3>
          <p className="text-xs text-on-surface-variant">
            Vous pouvez créer un projet sans client sur la plateforme. Ces informations sont pour votre suivi interne.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-on-surface-variant mb-2">
                Nom du client
              </label>
              <input
                id="client_name"
                type="text"
                value={formData.client_name}
                onChange={(e) => updateField("client_name", e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
              />
            </div>
            <div>
              <label htmlFor="client_email" className="block text-sm font-medium text-on-surface-variant mb-2">
                Email du client
              </label>
              <input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => updateField("client_email", e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>
        </div>

        {/* Timeline & Budget */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-on-surface">Planning & Budget</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-on-surface-variant mb-2">
                Date de début
              </label>
              <input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-on-surface-variant mb-2">
                Date de fin prévue
              </label>
              <input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="budget" className="block text-sm font-medium text-on-surface-variant mb-2">
                Budget
              </label>
              <input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget || ""}
                onChange={(e) => updateField("budget", e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-on-surface-variant mb-2">
                Devise
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => updateField("currency", e.target.value as 'XOF' | 'EUR' | 'USD')}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
              >
                <option value="XOF">XOF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-on-surface">Photos du projet</h3>
          <p className="text-xs text-on-surface-variant">
            Ajoutez des photos pour documenter votre projet. Vous pourrez définir la photo principale ci-dessous.
          </p>
          <ProjectPhotoUpload
            photoUrls={imageUrls}
            featuredPhoto={imageUrls[0] || null}
            onPhotosChange={setImageUrls}
            onFeaturedPhotoChange={() => {}} // Auto-first image is main
          />
        </div>

        {/* Portfolio */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-on-surface">Visibilité</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => updateField("is_public", e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-on-surface">
                Afficher sur mon portfolio public
              </span>
              <p className="text-xs text-on-surface-variant/60 mt-0.5">
                Ce projet sera visible sur votre page professionnelle une fois terminé
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-on-primary rounded-2xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Créer le projet
            </>
          )}
        </button>
      </form>
    </div>
  );
}
