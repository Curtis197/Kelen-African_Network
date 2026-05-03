"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, X, Upload, Type, FileText, ExternalLink, Save, Smartphone, Clock, Users, Link as LinkIcon, Plus, Wand2, User, CheckCircle2 } from "lucide-react";
import AICopywritingDialog from "@/components/forms/AICopywritingDialog";

interface ProProfileData {
  description: string;
  services_offered: string[];
  years_experience: number | null;
  team_size: number | null;
  whatsapp: string;
  hero_image_url: string | null;
  hero_tagline: string;
  about_text: string;
  portfolio_photos: string[];
  profile_picture_url: string | null;
}

const MAX_PHOTOS = 15;

export function ProProfileForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [servicesInput, setServicesInput] = useState("");
  const [portfolioPreviews, setPortfolioPreviews] = useState<{ url: string; file: File }[]>([]);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");

  const [formData, setFormData] = useState<ProProfileData>({
    description: "",
    services_offered: [],
    years_experience: null,
    team_size: null,
    whatsapp: "",
    hero_image_url: null,
    hero_tagline: "",
    about_text: "",
    portfolio_photos: [],
    profile_picture_url: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
    } else if (data) {
      setFormData({
        description: data.description || "",
        services_offered: data.services_offered || [],
        years_experience: data.years_experience || null,
        team_size: data.team_size || null,
        whatsapp: data.whatsapp || "",
        hero_image_url: data.hero_image_url || null,
        hero_tagline: data.hero_tagline || "",
        about_text: data.about_text || "",
        portfolio_photos: data.portfolio_photos || [],
        profile_picture_url: data.profile_picture_url || null,
      });
      setHeroPreview(data.hero_image_url);
      setProfilePreview(data.profile_picture_url);
      setSlug(data.slug);
      setBusinessName(data.business_name || "");
      setCategory(data.category || "");
    }
    setIsLoading(false);
  };

  const updateField = <K extends keyof ProProfileData>(field: K, value: ProProfileData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // â”€â”€ Image Upload Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const uploadImage = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = file.name.split('.').pop() || 'jpg';
    const fullPath = `${path}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, { contentType: file.type, upsert: true });

    if (error) {
      toast.error(`Erreur upload: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    return data.publicUrl;
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const url = await uploadImage(file, 'covers', `professionals/${user.id}/hero`);
    if (url) {
      updateField("hero_image_url", url);
      setHeroPreview(url);
      toast.success("Image hero mise Ã  jour");
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const url = await uploadImage(file, 'avatars', `professionals/${user.id}/profile`);
    if (url) {
      updateField("profile_picture_url", url);
      setProfilePreview(url);
      toast.success("Photo de profil mise Ã  jour");
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentCount = formData.portfolio_photos.length + portfolioPreviews.length;
    const remaining = MAX_PHOTOS - currentCount;

    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos atteint`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);

    // Create local previews immediately
    const newPreviews: { url: string; file: File }[] = [];
    for (const file of filesToUpload) {
      const previewUrl = URL.createObjectURL(file);
      newPreviews.push({ url: previewUrl, file });
    }
    setPortfolioPreviews(prev => [...prev, ...newPreviews]);

    // Upload in background
    for (const file of filesToUpload) {
      const url = await uploadImage(file, 'photos', `professionals/${user.id}/portfolio`);
      if (url) {
        updateField("portfolio_photos", [...formData.portfolio_photos, url]);
        // Remove from previews
        setPortfolioPreviews(prev => prev.filter(p => p.file !== file));
      }
    }

    if (remaining < filesToUpload.length) {
      toast.info(`${remaining} photo(s) ajoutée(s). Maximum ${MAX_PHOTOS} atteint.`);
    } else {
      toast.success(`${filesToUpload.length} photo(s) ajoutée(s)`);
    }
  };

  const removePortfolioPhoto = (index: number) => {
    const newPhotos = formData.portfolio_photos.filter((_, i) => i !== index);
    updateField("portfolio_photos", newPhotos);
    toast.success("Photo retirée");
  };

  // â”€â”€ Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const addService = () => {
    const trimmed = servicesInput.trim();
    if (trimmed && !formData.services_offered.includes(trimmed)) {
      updateField("services_offered", [...formData.services_offered, trimmed]);
      setServicesInput("");
    }
  };

  const removeService = (service: string) => {
    updateField(
      "services_offered",
      formData.services_offered.filter((s) => s !== service)
    );
  };

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const onSubmit = async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("professionals")
        .update({
          description: formData.description,
          services_offered: formData.services_offered,
          years_experience: formData.years_experience,
          team_size: formData.team_size,
          whatsapp: formData.whatsapp,
          hero_image_url: formData.hero_image_url,
          hero_tagline: formData.hero_tagline,
          about_text: formData.about_text,
          portfolio_photos: formData.portfolio_photos,
          profile_picture_url: formData.profile_picture_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profil mis Ã  jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise Ã  jour du profil");
    } finally {
      setIsSaving(false);
    }
  };

  const openPreview = () => {
    if (slug) {
      window.open(`/professionnels/${slug}`, '_blank');
    } else {
      toast.info("Sauvegardez d'abord le profil pour générer le slug");
    }
  };

  const handleAIGenerated = (accroche: string, presentation: string) => {
    updateField("hero_tagline", accroche);
    updateField("about_text", presentation);
  };

  // â”€â”€ Section completion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sectionStatus = [
    { key: "hero",        label: "Hero",        done: !!(formData.hero_image_url || formData.hero_tagline) },
    { key: "photo",       label: "Photo",       done: !!formData.profile_picture_url },
    { key: "about",       label: "À propos",    done: formData.about_text.length > 20 },
    { key: "portfolio",   label: "Portfolio",   done: formData.portfolio_photos.length > 0 },
    { key: "description", label: "Description", done: formData.description.length > 20 },
    { key: "services",    label: "Services",    done: formData.services_offered.length > 0 },
    { key: "details",     label: "Détails",     done: !!(formData.years_experience || formData.team_size) },
    { key: "whatsapp",    label: "WhatsApp",    done: !!formData.whatsapp },
  ];
  const completedCount = sectionStatus.filter((s) => s.done).length;
  const completionPct  = Math.round((completedCount / sectionStatus.length) * 100);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-24 bg-surface-container-high rounded-xl w-full" />
        <div className="h-10 bg-surface-container-high rounded-xl w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-surface-container-high rounded-xl w-full" />
          <div className="h-10 bg-surface-container-high rounded-xl w-full" />
        </div>
        <div className="h-12 bg-surface-container-high rounded-xl w-full mt-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* â”€â”€ Progress + Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        {/* Top row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                Complétude du profil
              </span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  completionPct === 100
                    ? "bg-kelen-green-100 text-kelen-green-700"
                    : completionPct >= 50
                    ? "bg-kelen-yellow-100 text-kelen-yellow-700"
                    : "bg-kelen-red-50 text-kelen-red-600"
                }`}
              >
                {completionPct}%
              </span>
            </div>
            {slug && (
              <p className="text-xs text-on-surface-variant/60 mt-0.5">
                kelen.africa/professionnels/
                <span className="text-primary font-medium">{slug}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAIDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              IA
            </button>
            <button
              type="button"
              onClick={openPreview}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-container text-on-surface rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Aperçu
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionPct}%`,
              background:
                completionPct === 100
                  ? "#009639"
                  : completionPct >= 50
                  ? "#FCCF00"
                  : "#CE1126",
            }}
          />
        </div>

        {/* Section pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sectionStatus.map((s) => (
            <span
              key={s.key}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                s.done
                  ? "bg-kelen-green-50 text-kelen-green-700"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {s.done ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-current opacity-40" />
              )}
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* â”€â”€ Section 1: Hero Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
              <ImagePlus className="w-3.5 h-3.5" />
            </span>
            Section Hero
          </h3>
          {sectionStatus[0].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="p-6 space-y-5">

        {/* Hero Image */}
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2">
            Image d'arrière-plan
          </label>
          {heroPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-video bg-surface-container">
              <Image 
                src={heroPreview} 
                alt="Hero" 
                fill 
                sizes="(max-width: 1200px) 100vw, 800px"
                className="object-cover" 
              />
              <button
                type="button"
                onClick={() => { updateField("hero_image_url", null); setHeroPreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80"
                aria-label="Supprimer l'image hero"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-outline-variant/40 bg-surface-container-lowest cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-on-surface-variant/40 mb-2" />
              <span className="text-sm text-on-surface-variant">Cliquer pour ajouter une image hero</span>
              <span className="text-xs text-on-surface-variant/60 mt-1">1920x800 recommandé</span>
              <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Hero Tagline */}
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            Phrase d'accroche (hero tagline)
          </label>
          <input
            type="text"
            value={formData.hero_tagline}
            onChange={(e) => updateField("hero_tagline", e.target.value)}
            placeholder="Ex: Construction de qualité, livrée dans les délais"
            maxLength={150}
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
          />
          <p className="text-xs text-on-surface-variant/60 mt-1 text-right">
            {formData.hero_tagline.length}/150
          </p>
        </div>
        </div>
      </div>

      {/* â”€â”€ Section 2: Profile Photo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 flex-shrink-0">
              <User className="w-3.5 h-3.5" />
            </span>
            Photo de Profil
          </h3>
          {sectionStatus[1].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="p-6 space-y-4">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 relative rounded-xl overflow-hidden bg-surface-container border-2 border-outline-variant/20 flex-shrink-0">
            {profilePreview ? (
              <Image 
                src={profilePreview} 
                alt="Profile" 
                fill 
                sizes="96px"
                className="object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="text-3xl text-on-surface-variant/30" />
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl text-sm font-medium cursor-pointer hover:bg-surface-container-high transition-colors">
              <Upload className="w-4 h-4" />
              Choisir une photo
              <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
            </label>
            <p className="text-xs text-on-surface-variant/60 mt-2">
              Apparaît dans la section contact
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* â”€â”€ Section 3: About Text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 flex-shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </span>
            Texte Â« À propos Â»
          </h3>
          {sectionStatus[2].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="p-6 space-y-4">
        <textarea
          value={formData.about_text}
          onChange={(e) => updateField("about_text", e.target.value)}
          rows={5}
          placeholder="Décrivez votre philosophie, votre parcours et ce qui vous distingue..."
          maxLength={2000}
          className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
        />
        <p className="text-xs text-on-surface-variant/60 text-right">
          {formData.about_text.length}/2000
        </p>
        </div>
      </div>

      {/* â”€â”€ Section 4: Portfolio Photos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
              <ImagePlus className="w-3.5 h-3.5" />
            </span>
            Portfolio
            <span className="text-xs font-normal text-on-surface-variant">
              ({formData.portfolio_photos.length}/{MAX_PHOTOS})
            </span>
          </h3>
          {sectionStatus[3].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="p-6 space-y-4">

        {/* Existing photos */}
        {formData.portfolio_photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {formData.portfolio_photos.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-surface-container group">
                <Image 
                  src={url} 
                  alt={`Portfolio ${index + 1}`} 
                  fill 
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 150px"
                  className="object-cover" 
                />
                <button
                  type="button"
                  onClick={() => removePortfolioPhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Supprimer photo ${index + 1}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload */}
        {formData.portfolio_photos.length < MAX_PHOTOS && (
          <label className="flex flex-col items-center justify-center py-6 rounded-xl border-2 border-dashed border-outline-variant/40 bg-surface-container-lowest cursor-pointer hover:border-primary/50 transition-colors">
            <Plus className="w-6 h-6 text-on-surface-variant/40 mb-1" />
            <span className="text-sm text-on-surface-variant">Ajouter des photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePortfolioUpload}
              className="hidden"
            />
          </label>
        )}

        {/* Pending uploads */}
        {portfolioPreviews.length > 0 && (
          <div className="text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {portfolioPreviews.length} photo(s) en cours d'upload...
            </span>
          </div>
        )}
        </div>
      </div>

      {/* â”€â”€ Section 5: Description â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 flex-shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </span>
            Description de l'activité
          </h3>
          {sectionStatus[4].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="p-6 space-y-4">
        <textarea
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Décrivez votre expertise, votre parcours..."
          className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
        />
        <p className="text-xs text-on-surface-variant/60 text-right">
          {formData.description.length}/500
        </p>
        </div>
      </div>

      {/* â”€â”€ Section 6: Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </span>
            Services & Spécialités
          </h3>
          {sectionStatus[5].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={servicesInput}
            onChange={(e) => setServicesInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
            placeholder="Ex: Construction Villa, Électricité..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
          />
          <button
            type="button"
            onClick={addService}
            className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90"
          >
            Ajouter
          </button>
        </div>
        {formData.services_offered.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.services_offered.map((service) => (
              <span
                key={service}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-full text-xs font-medium"
              >
                {service}
                <button
                  type="button"
                  onClick={() => removeService(service)}
                  className="text-on-surface-variant/60 hover:text-error"
                  aria-label={`Supprimer ${service}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* â”€â”€ Section 7: Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600 flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </span>
            Expérience & Équipe
          </h3>
          {sectionStatus[6].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Années d'expérience
            </label>
            <input
              type="number"
              value={formData.years_experience ?? ""}
              onChange={(e) => updateField("years_experience", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Taille de l'équipe
            </label>
            <input
              type="number"
              value={formData.team_size ?? ""}
              onChange={(e) => updateField("team_size", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
            />
          </div>
        </div>
      </div>

      {/* â”€â”€ Section 8: WhatsApp â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 flex-shrink-0" style={{ color: "#25D366" }}>
              <Smartphone className="w-3.5 h-3.5" />
            </span>
            WhatsApp Business
          </h3>
          {sectionStatus[7].done && (
            <span className="flex items-center gap-1 text-xs font-medium text-kelen-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complété
            </span>
          )}
        </div>
        <div className="p-6">
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            placeholder="+225 00 00 00 00 00"
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
          />
          <p className="mt-2 text-xs text-on-surface-variant/60">
            Affiché sur votre page publique pour que les clients puissent vous contacter directement
          </p>
        </div>
      </div>

      {/* â”€â”€ Sticky save footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl border border-border bg-white/90 p-3 shadow-xl shadow-black/10 backdrop-blur-md flex items-center gap-3">
          {/* Completion mini-bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant">
                {completedCount}/{sectionStatus.length} sections complétées
              </span>
              <span className="text-xs font-bold text-on-surface">{completionPct}%</span>
            </div>
            <div className="h-1 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completionPct}%`,
                  background:
                    completionPct === 100
                      ? "#009639"
                      : completionPct >= 50
                      ? "#FCCF00"
                      : "#CE1126",
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-md shadow-primary/25 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enregistrement"¦
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Copywriting Dialog */}
      <AICopywritingDialog
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        businessName={businessName}
        category={category}
        onGenerated={handleAIGenerated}
      />
    </div>
  );
}
