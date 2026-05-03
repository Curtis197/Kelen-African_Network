"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, X, AlertCircle, ImagePlus, Trash2, Star, StarOff, Upload, Loader2 } from "lucide-react";
import { LocationSearch, type LocationData } from "@/components/location/LocationSearch";
import { uploadFile } from "@/lib/supabase/storage";
import { getProjectImages, uploadProjectImage, deleteProjectImage, setMainProjectImage, type ProjectImage } from "@/lib/actions/project-images";
import NextImage from "next/image";


interface Project {
  id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  location_country?: string;
  location_formatted?: string;
  status: "en_preparation" | "en_cours" | "en_pause" | "termine" | "annule";
  budget_total: number;
  budget_currency: string;
  start_date?: string;
  end_date?: string;
  objectives?: any[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

const STATUS_CONFIG = {
  en_preparation: { label: "En préparation", color: "bg-stone-100 text-stone-700" },
  en_cours: { label: "En cours", color: "bg-blue-50 text-blue-700" },
  en_pause: { label: "En pause", color: "bg-orange-50 text-orange-700" },
  termine: { label: "Terminé", color: "bg-green-50 text-green-700" },
  annule: { label: "Annulé", color: "bg-red-50 text-red-700" },
};

const CATEGORIES = [
  "Construction",
  "Rénovation",
  "Architecture",
  "Design",
  "Ingénierie",
  "Électricité",
  "Plomberie",
  "Peinture",
  "Menuiserie",
  "Jardinage",
  "Autre",
];

const CURRENCIES = ["EUR", "XOF", "USD"];

export default function EditClientProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id || "";
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();


  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Non authentifié");
      router.push("/connexion");
      return;
    }

    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("id", projectId)
      .single();


    if (error?.code === '42501') {
      toast.error("Accès refusé - Vous n'avez pas les droits sur ce projet");
      router.push("/projets");
    } else if (error || !data) {
      toast.error("Projet introuvable");
      router.push("/projets");
    } else {
      if (data.user_id !== user.id) {
        toast.error("Vous n'avez pas les droits sur ce projet");
        router.push("/projets");
        return;
      }

      setProject(data);
      setFormData(data);
      
      // Initialize location data from existing project
      if (data.location_lat && data.location_lng) {
        setLocationData({
          name: data.location || "",
          formatted_address: data.location_formatted || data.location || "",
          lat: data.location_lat,
          lng: data.location_lng,
          country: data.location_country,
          city: data.location,
        });
      }
      
    }

    // Fetch images after project loads
    await fetchImages();

    setIsLoading(false);
  };

  const fetchImages = async () => {
    setImagesLoading(true);
    const imgs = await getProjectImages(projectId);
    setImages(imgs);
    setImagesLoading(false);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!project) return;

    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Session expirée");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("user_projects")
      .update({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        location_formatted: formData.location_formatted,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        location_country: formData.location_country,
        status: formData.status,
        budget_total: formData.budget_total,
        budget_currency: formData.budget_currency,
        start_date: formData.start_date,
        end_date: formData.end_date,
        objectives: formData.objectives,
      })
      .eq("id", project.id)
      .eq("user_id", user.id);


    if (error?.code === '42501') {
      toast.error("Modification refusée - Accès non autorisé");
    } else if (error) {
      toast.error("Erreur lors de la modification: " + error.message);
    } else {
      toast.success("Projet modifié avec succès");
      setHasChanges(false);
      router.push(`/projets/${project.id}`);
      router.refresh();
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("Voulez-vous vraiment annuler ? Les modifications non enregistrées seront perdues.")) {
        router.push(`/projets/${project?.id}`);
      }
    } else {
      router.push(`/projets/${project?.id}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) {
      toast.error("Aucun fichier sélectionné");
      return;
    }


    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG ou WEBP");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (file.size > maxSize) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }

    setIsUploading(true);

    try {
      // Get auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expirée");
        setIsUploading(false);
        return;
      }

      // Build upload path
      const uploadPath = `${user.id}/projects/${projectId}/images`;

      // Upload to storage
      const imageUrl = await uploadFile(file, "portfolios", uploadPath);

      if (!imageUrl) {
        toast.error("Erreur lors de l'upload de l'image");
        setIsUploading(false);
        return;
      }

      // Save to database

      const imgResult = await uploadProjectImage(projectId, imageUrl);

      if (!imgResult.success) {
        toast.error(imgResult.error || "Erreur lors de l'enregistrement de l'image");
        setIsUploading(false);
        return;
      }

      toast.success("Image ajoutée avec succès");

      // Refresh image list
      await fetchImages();

    } catch (err) {
      toast.error("Erreur lors de l'upload: " + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const result = await deleteProjectImage(imageId, projectId);

    if (result.success) {
      toast.success("Image supprimée");
      await fetchImages();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    const result = await setMainProjectImage(imageId, projectId);

    if (result.success) {
      toast.success("Image principale définie");
      await fetchImages();
    } else {
      toast.error(result.error || "Erreur lors de la définition de l'image principale");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <main className="min-h-screen bg-surface font-body text-on-surface">
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au projet
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Modifier le projet
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Modifiez les informations de votre projet
              </p>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-2 bg-kelen-yellow-50 text-kelen-yellow-700 rounded-lg text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Modifications non enregistrées
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-border p-6 sm:p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Titre du projet *
            </label>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              placeholder="Ex: Construction villa Dakar"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              placeholder="Décrivez votre projet..."
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Catégorie
              </label>
              <select
                value={formData.category || ""}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              >
                <option value="">Non définie</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Statut
              </label>
              <select
                value={formData.status || "en_preparation"}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Localisation
            </label>
            <LocationSearch
              value={locationData}
              onChange={(location) => {
                setLocationData(location);
                if (location) {
                  updateField("location", location.city || location.name);
                  updateField("location_formatted", location.formatted_address);
                  updateField("location_lat", location.lat);
                  updateField("location_lng", location.lng);
                  updateField("location_country", location.country);
                } else {
                  updateField("location", "");
                  updateField("location_formatted", "");
                  updateField("location_lat", undefined);
                  updateField("location_lng", undefined);
                  updateField("location_country", "");
                }
              }}
              placeholder="Ex: Dakar, Sénégal"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Recherchez une ville, adresse ou lieu (autocomplétion Google Maps)
            </p>
          </div>

          {/* Budget & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Budget total
              </label>
              <input
                type="number"
                value={formData.budget_total || 0}
                onChange={(e) => updateField("budget_total", Number(e.target.value))}
                min="0"
                step="1000"
                className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Devise
              </label>
              <select
                value={formData.budget_currency || "EUR"}
                onChange={(e) => updateField("budget_currency", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={formData.start_date?.split("T")[0] || ""}
                onChange={(e) => updateField("start_date", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date de fin (prévue ou réelle)
              </label>
              <input
                type="date"
                value={formData.end_date?.split("T")[0] || ""}
                onChange={(e) => updateField("end_date", e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-kelen-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Image Management Section */}
        <div className="bg-white rounded-xl border border-border p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                Images du projet
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ajoutez des photos pour illustrer votre projet
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                handleImageUpload(e);
              }}
              disabled={isUploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                }
              }}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-kelen-green-600 text-white rounded-lg hover:bg-kelen-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Upload..." : "Ajouter"}
            </button>
          </div>

          {imagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-lowest rounded-lg border border-dashed border-border">
              <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucune image pour le moment
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cliquez sur &quot;Ajouter&quot; pour uploader une photo
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-surface-container-low border border-border"
                >
                  <NextImage
                    src={img.url}
                    alt="Project image"
                    fill
                    className="object-cover"
                  />
                  
                  {/* Main badge */}
                  {img.is_main && (
                    <div className="absolute top-2 left-2 bg-kelen-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Principale
                    </div>
                  )}

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!img.is_main && (
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(img.id)}
                        className="p-2 bg-white rounded-full hover:bg-kelen-green-50 transition-colors"
                        title="Définir comme principale"
                      >
                        <Star className="w-4 h-4 text-kelen-green-600" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3 border border-border text-foreground rounded-lg hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full sm:w-auto px-6 py-3 bg-kelen-green-600 text-white rounded-lg hover:bg-kelen-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informations</p>
              <ul className="space-y-1 text-blue-700">
                <li>â€¢ Tous les champs sauf le titre sont optionnels</li>
                <li>â€¢ Les modifications sont enregistrées immédiatement</li>
                <li>â€¢ Pour ajouter des professionnels, utilisez la page du projet</li>
                <li>â€¢ La première image ajoutée devient automatiquement l'image principale</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
