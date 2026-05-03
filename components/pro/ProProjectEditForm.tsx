"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProProject } from "@/lib/actions/pro-projects";
import type { ProProject, ProProjectFormData, ProProjectStatus } from "@/lib/types/pro-projects";
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

interface ProProjectEditFormProps {
  project: ProProject;
}

export function ProProjectEditForm({ project }: ProProjectEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProProjectFormData>({
    title: project.title,
    description: project.description || "",
    category: project.category || "construction",
    location: project.location || "",
    client_name: project.client_name || "",
    client_email: project.client_email || "",
    client_phone: project.client_phone || "",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    budget: project.budget ?? 0,
    currency: project.currency || "XOF",
    status: project.status,
    is_public: project.is_public,
    completion_notes: project.completion_notes || "",
  });

  const [imageUrls, setImageUrls] = useState<string[]>(
    project.images?.map(img => img.url) || []
  );

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

    try {
      const result = await updateProProject(project.id, formData, imageUrls);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Projet mis Ã  jour avec succès");
      router.push(`/pro/projets/${project.id}`);
      router.refresh();
    } catch (err) {
      toast.error("Erreur inattendue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-stone-600 transition hover:bg-stone-100"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Modifier le projet</h1>
          <p className="text-sm text-stone-600">Modifiez les informations de votre projet</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
        {/* Title */}
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-stone-700">
            Titre du projet <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            placeholder="Ex: Construction villa Banana"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-stone-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            placeholder="Décrivez le projet en détail..."
          />
        </div>

        {/* Category & Status */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-stone-700">
              Catégorie
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-stone-700">
              Statut
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => updateField("status", e.target.value as ProProjectStatus)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            >
              <option value="in_progress">En cours</option>
              <option value="completed">Terminé</option>
              <option value="on_hold">En pause</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-medium text-stone-700">
            Lieu
          </label>
          <LocationSearch
            value={formData.location ? { name: formData.location, formatted_address: formData.location, lat: 0, lng: 0 } : null}
            onChange={(loc: LocationData | null) => updateField("location", loc?.formatted_address || "")}
            placeholder="Ex: Cocody, Abidjan"
          />
        </div>

        {/* Client Info */}
        <div className="space-y-4 rounded-lg bg-stone-50 p-4">
          <h3 className="text-sm font-semibold text-stone-700">Informations client</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="client_name" className="mb-2 block text-sm text-stone-600">
                Nom
              </label>
              <input
                id="client_name"
                type="text"
                value={formData.client_name}
                onChange={(e) => updateField("client_name", e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
              />
            </div>

            <div>
              <label htmlFor="client_email" className="mb-2 block text-sm text-stone-600">
                Email
              </label>
              <input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => updateField("client_email", e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
              />
            </div>

            <div>
              <label htmlFor="client_phone" className="mb-2 block text-sm text-stone-600">
                Téléphone
              </label>
              <input
                id="client_phone"
                type="tel"
                value={formData.client_phone}
                onChange={(e) => updateField("client_phone", e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date" className="mb-2 block text-sm font-medium text-stone-700">
              Date de début
            </label>
            <input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => updateField("start_date", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="mb-2 block text-sm font-medium text-stone-700">
              Date de fin
            </label>
            <input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => updateField("end_date", e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            />
          </div>
        </div>

        {/* Budget */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="budget" className="mb-2 block text-sm font-medium text-stone-700">
              Budget
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              value={formData.budget}
              onChange={(e) => updateField("budget", Number(e.target.value))}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            />
          </div>

          <div>
            <label htmlFor="currency" className="mb-2 block text-sm font-medium text-stone-700">
              Devise
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => updateField("currency", e.target.value as 'XOF' | 'EUR' | 'USD')}
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            >
              <option value="XOF">XOF (Franc CFA)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar US)</option>
            </select>
          </div>
        </div>

        {/* Completion Notes */}
        <div>
          <label htmlFor="completion_notes" className="mb-2 block text-sm font-medium text-stone-700">
            Notes de fin de projet
          </label>
          <textarea
            id="completion_notes"
            value={formData.completion_notes}
            onChange={(e) => updateField("completion_notes", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-kelen-green-500 focus:outline-none focus:ring-2 focus:ring-kelen-green-500/20"
            placeholder="Notes optionnelles sur la réalisation du projet..."
          />
        </div>

        {/* Photos */}
        <div className="space-y-4 rounded-lg bg-stone-50 p-4">
          <h3 className="text-sm font-semibold text-stone-700">Photos du projet</h3>
          <p className="text-xs text-stone-600">
            Ajoutez ou modifiez les photos de votre projet. Cliquez sur l'étoile pour définir la photo principale.
          </p>
          <ProjectPhotoUpload
            photoUrls={imageUrls}
            featuredPhoto={imageUrls[0] || null}
            onPhotosChange={setImageUrls}
            onFeaturedPhotoChange={() => {}}
          />
        </div>

        {/* Public Toggle */}
        <div className="flex items-center gap-3 rounded-lg bg-kelen-green-50 p-4">
          <input
            id="is_public"
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => updateField("is_public", e.target.checked)}
            className="h-5 w-5 rounded border-stone-300 text-kelen-green-600 focus:ring-kelen-green-500"
          />
          <label htmlFor="is_public" className="text-sm font-medium text-stone-700">
            Afficher sur mon portfolio public
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-kelen-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-kelen-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
