"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upsertProject, getProject } from "@/lib/actions/projects";
import { uploadProjectImage } from "@/lib/actions/project-images";
import { uploadFile } from "@/lib/supabase/storage";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LocationSearch, type LocationData } from "@/components/location/LocationSearch";
import { 
  Fingerprint, DraftingCompass, Calendar, Banknote, Verified,
  Pencil, Scale, GraduationCap, HeartPulse, Wrench, Building2, Leaf, Ellipsis,
  ChevronLeft, ChevronRight, Check, Star, Trash2, ImagePlus, Image as ImageIcon, Plus, X, ArrowRight, ArrowLeft, CheckCircle 
} from "lucide-react";
import NextImage from "next/image";

type ProjectData = {
  id?: string;
  title: string;
  category: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
  location_country?: string;
  location_formatted?: string;
  budget_total: number;
  budget_currency: "EUR" | "XOF" | "USD";
  start_date?: string;
  end_date?: string;
  description: string;
  objectives: string[];
};

const STEPS = [
  { id: "identity", label: "Identité", icon: Fingerprint },
  { id: "financial", label: "Finances", icon: Banknote },
  { id: "timeline", label: "Calendrier", icon: Calendar },
  { id: "details", label: "Détails", icon: DraftingCompass },
  { id: "review", label: "Revision", icon: Verified },
];

export default function ProjectWizard({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(!!initialId);
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProjectData>({
    title: "",
    category: "construction",
    location: "Sénégal", // Default
    budget_total: 0,
    budget_currency: "XOF",
    description: "",
    objectives: [],
  });

  useEffect(() => {
    if (initialId) {
      const fetchProject = async () => {
        setIsLoadingData(true);
        try {
          const project = await getProject(initialId);
          if (project) {
            setFormData({
              id: project.id,
              title: project.title,
              category: project.category,
              location: project.location,
              budget_total: project.budget_total || 0,
              budget_currency: project.budget_currency || "XOF",
              start_date: project.start_date,
              end_date: project.end_date,
              description: project.description || "",
              objectives: project.objectives || [],
            });
          }
        } catch (err) {
          toast.error("Erreur lors du chargement du projet");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchProject();
    }
  }, [initialId]);

  const updateFormData = (data: Partial<ProjectData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter(f => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(f.type)) {
        toast.error(`${f.name}: format non supporté. Utilisez JPG, PNG ou WEBP`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: fichier trop volumineux (max 10 Mo)`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setProjectImages(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setProjectImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (currentStep === STEPS.length) {
      // Final step - upload images then redirect
      setIsSaving(true);
      try {
        const projectId = formData.id;
        if (projectId && projectImages.length > 0) {
          const { data: { user } } = await (await import("@/lib/supabase/client")).createClient().auth.getUser();
          if (user) {
            for (let i = 0; i < projectImages.length; i++) {
              const file = projectImages[i];
              const imageUrl = await uploadFile(file, "portfolios", `${user.id}/projects/${projectId}/images`);
              if (imageUrl) {
                await uploadProjectImage(projectId, imageUrl);
              }
            }
            toast.success(`${projectImages.length} image(s) ajoutée(s)`);
          }
        }
        router.push("/projets");
      } catch (err) {
        toast.error("Erreur lors de l'upload des images");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      const result = await upsertProject(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        updateFormData({ id: result.data.id });
        setCurrentStep((prev) => prev + 1);
        toast.success("Progrès enregistré");
      }
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">
      {/* Side Navigation */}
      <aside className="hidden lg:flex flex-col gap-2 p-6 h-screen w-64 fixed left-0 top-0 pt-24 bg-surface-container-low">
        <div className="mb-8 px-2">
          <h2 className="font-headline font-bold text-on-surface">Assistant de Projet</h2>
          <p className="text-xs text-on-surface-variant opacity-70">Le Diplomate Numérique</p>
        </div>
        <nav className="flex flex-col gap-2">
          {STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-all rounded-xl cursor-default",
                  isActive 
                    ? "bg-surface-container-lowest text-primary shadow-sm" 
                    : "text-on-surface opacity-60 hover:bg-surface-container"
                )}
              >
                <step.icon className={`w-5 h-5 ${currentStep >= idx + 1 ? "text-primary" : "text-stone-400"}`} />
                <span className="font-medium text-sm">{step.label}</span>
                {isCompleted && (
                  <CheckCircle className="text-primary text-sm ml-auto" />
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-24 pb-32 min-h-screen w-full">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-on-surface-variant font-headline font-bold uppercase tracking-widest text-xs">Chargement du projet...</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto px-8 lg:px-12 py-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {currentStep === 1 && (
                    <Step1Identity formData={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 2 && (
                    <Step2Financial formData={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 3 && (
                    <Step3Timeline formData={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 4 && (
                    <Step4Objectives formData={formData} onChange={updateFormData} />
                  )}
                  {currentStep === 5 && (
                    <Step5Review
                      formData={formData}
                      projectImages={projectImages}
                      imagePreviews={imagePreviews}
                      fileInputRef={fileInputRef}
                      onImageSelect={handleImageSelect}
                      onRemoveImage={removeImage}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 w-full z-50 h-16 md:h-24 bg-surface/80 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-center px-4 md:px-12 h-full w-full max-w-7xl mx-auto relative">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isSaving}
            className="flex items-center gap-2 bg-surface-container text-on-surface rounded-lg px-8 py-3 font-headline font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-30"
          >
            <ArrowLeft className="text-sm" />
            Précédent
          </button>

          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-3 rounded-full transition-all duration-300",
                  currentStep === idx + 1 ? "w-8 bg-primary" : "w-3 bg-surface-container-highest"
                )}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-tr from-primary to-primary-container text-white rounded-lg px-8 py-3 font-headline font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            {isSaving ? "Enregistrement..." : currentStep === STEPS.length ? "Terminer" : "Suivant"}
            <ArrowRight className="text-sm" />
          </button>
        </div>
      </footer>
    </div>
  );
}

// --- Internal Step Components ---

function Step1Identity({ formData, onChange }: { formData: ProjectData; onChange: (d: Partial<ProjectData>) => void }) {
  const categories = [
    { id: "architecture", label: "Architecture & Design", icon: DraftingCompass },
    { id: "construction", label: "Gros œuvre", icon: DraftingCompass },
    { id: "renovation", label: "Rénovation", icon: Pencil },
    { id: "juridique", label: "Conseil Juridique", icon: Scale },
    { id: "etudes", label: "Études & Expertise", icon: GraduationCap },
    { id: "securite", label: "Sécurité & Domotique", icon: HeartPulse },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "immobilier", label: "Promotion Immobilière", icon: Building2 },
    { id: "ecologie", label: "Solutions Écologiques", icon: Leaf },
    { id: "autre", label: "Autre projet", icon: Ellipsis },
  ];

  return (
    <div className="space-y-12">
      <header className="mb-16 space-y-4">
        <h1 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl text-on-surface tracking-tight">
          01 Identité du Projet
        </h1>
        <p className="text-base md:text-xl text-on-surface-variant opacity-80 max-w-2xl font-body leading-relaxed">
          Commençons par les bases. Comment souhaitez-vous nommer votre vision et dans quelle catégorie s'inscrit-elle ?
        </p>
      </header>

      <div className="bg-surface-container-lowest rounded-[2rem] p-6 md:p-8 lg:p-16 shadow-sm relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-12">
          <div className="space-y-4">
            <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Nom du Projet</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Ex: Villa de la Teranga"
              className="text-2xl md:text-4xl lg:text-5xl font-headline font-extrabold border-none p-0 focus:ring-0 w-full bg-transparent text-on-surface placeholder:text-surface-container-highest"
            />
            <div className="h-[2px] w-full bg-surface-container-high relative overflow-hidden">
              <div className={cn("absolute inset-0 bg-primary transition-all duration-500", formData.title ? "w-full" : "w-0")}></div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Localisation du Projet</label>
            <LocationSearch
              value={
                formData.location_lat && formData.location_lng
                  ? {
                      name: formData.location,
                      formatted_address: formData.location_formatted || formData.location,
                      lat: formData.location_lat,
                      lng: formData.location_lng,
                      country: formData.location_country,
                    }
                  : null
              }
              onChange={(loc: LocationData | null) => {
                if (loc) {
                  onChange({
                    location: loc.name,
                    location_lat: loc.lat,
                    location_lng: loc.lng,
                    location_country: loc.country,
                    location_formatted: loc.formatted_address,
                  });
                } else {
                  onChange({
                    location: "Sénégal",
                    location_lat: undefined,
                    location_lng: undefined,
                    location_country: undefined,
                    location_formatted: undefined,
                  });
                }
              }}
              placeholder="Rechercher une ville, un pays..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onChange({ category: cat.id as any })}
                className={cn(
                  "p-6 rounded-2xl flex flex-col items-center gap-4 transition-all duration-200 border-2",
                  formData.category === cat.id
                    ? "bg-primary-container/10 border-primary text-primary"
                    : "bg-surface-container-low border-transparent hover:border-surface-container-highest"
                )}
              >
                <cat.icon className={`w-6 h-6 ${formData.category === cat.id ? "text-primary" : "text-stone-400"}`} />
                <span className="font-headline font-bold text-xs uppercase tracking-wider text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Financial({ formData, onChange }: { formData: ProjectData; onChange: (d: Partial<ProjectData>) => void }) {
  return (
    <div className="space-y-12">
      <header className="mb-16 space-y-4">
        <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-on-surface tracking-tight">
          02 Budget Estimé
        </h1>
        <p className="text-xl text-on-surface-variant opacity-80 max-w-2xl font-body leading-relaxed">
          Définissez le cadre financier. Kelen vous aide à sécuriser chaque étape de votre investissement.
        </p>
      </header>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-16 shadow-sm relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-16">
          <div className="space-y-6">
            <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Devise</label>
            <div className="inline-flex p-1.5 bg-surface-container-low rounded-full">
              {["EUR", "XOF", "USD"].map((curr) => (
                <button
                  key={curr}
                  onClick={() => onChange({ budget_currency: curr as any })}
                  className={cn(
                    "px-10 py-3 rounded-full font-headline font-bold text-sm transition-all duration-200",
                    formData.budget_currency === curr 
                      ? "bg-surface-container-lowest text-primary shadow-sm" 
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Montant global</label>
            <div className="flex items-baseline gap-4 group">
              <input
                type="number"
                value={formData.budget_total || ""}
                onChange={(e) => onChange({ budget_total: Number(e.target.value) })}
                className="text-6xl lg:text-8xl font-headline font-extrabold border-none p-0 focus:ring-0 w-full bg-transparent text-on-surface placeholder:text-surface-container-highest"
                placeholder="0"
              />
              <span className="text-4xl lg:text-5xl font-headline font-bold text-primary">
                {formData.budget_currency === "XOF" ? "CFA" : formData.budget_currency === "EUR" ? "â‚¬" : "$"}
              </span>
            </div>
            <div className="h-[2px] w-full bg-surface-container-high relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-container w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Timeline({ formData, onChange }: { formData: ProjectData; onChange: (d: Partial<ProjectData>) => void }) {
  return (
    <div className="space-y-12">
      <header className="mb-16 space-y-4">
        <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-on-surface tracking-tight">
          03 Horizon Temporel
        </h1>
        <p className="text-xl text-on-surface-variant opacity-80 max-w-2xl font-body leading-relaxed">
          Quand prévoyez-vous de commencer et de voir votre projet aboutir ?
        </p>
      </header>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-16 shadow-sm relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Date de début</label>
            <input
              type="date"
              value={formData.start_date || ""}
              onChange={(e) => onChange({ start_date: e.target.value })}
              className="w-full bg-surface-container-low rounded-2xl p-6 font-headline font-bold text-xl border-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-6">
            <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Date de livraison estimée</label>
            <input
              type="date"
              value={formData.end_date || ""}
              onChange={(e) => onChange({ end_date: e.target.value })}
              className="w-full bg-surface-container-low rounded-2xl p-6 font-headline font-bold text-xl border-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4Objectives({ formData, onChange }: { formData: ProjectData; onChange: (d: Partial<ProjectData>) => void }) {
  const [newTag, setNewTag] = useState("");

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !formData.objectives.includes(newTag.trim())) {
      onChange({ objectives: [...formData.objectives, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    onChange({ objectives: formData.objectives.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-12">
      <header className="mb-16 space-y-4">
        <h1 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl text-on-surface tracking-tight">
          04 Détails du Projet
        </h1>
        <p className="text-base md:text-xl text-on-surface-variant opacity-80 max-w-2xl font-body leading-relaxed">
          Décrivez votre projet en quelques mots et listez les jalons clés que vous souhaitez atteindre.
        </p>
      </header>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-16 shadow-sm space-y-12">
        <div className="space-y-6">
          <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Description du projet</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Décrivez votre vision..."
            className="w-full bg-surface-container-low rounded-3xl p-8 font-body text-xl border-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="space-y-6">
          <label className="font-headline font-bold text-sm tracking-widest uppercase text-on-surface-variant/60 block">Objectifs Clés</label>
          <div className="flex flex-wrap gap-3 mb-6">
            {formData.objectives.map(tag => (
              <button
                key={tag}
                onClick={() => removeTag(tag)}
                className="px-6 py-3 rounded-full bg-primary text-white font-headline font-bold text-sm flex items-center gap-2 hover:bg-primary-container transition-colors"
              >
                {tag}
                <X className="text-xs" />
              </button>
            ))}
          </div>
          <form onSubmit={addTag} className="relative">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ajouter un objectif..."
              className="w-full bg-surface-container-low rounded-full px-8 py-4 font-headline font-bold border-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Plus />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Step5Review({
  formData,
  projectImages,
  imagePreviews,
  fileInputRef,
  onImageSelect,
  onRemoveImage,
}: {
  formData: ProjectData;
  projectImages: File[];
  imagePreviews: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}) {
  return (
    <div className="space-y-12">
      <header className="mb-16 space-y-4">
        <h1 className="font-headline font-extrabold text-5xl lg:text-6xl text-on-surface tracking-tight">
          Récapitulatif
        </h1>
        <p className="text-xl text-on-surface-variant opacity-80 max-w-2xl font-body leading-relaxed">
          Vérifiez les détails de votre projet et ajoutez des photos avant la validation finale.
        </p>
      </header>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 lg:p-16 shadow-sm space-y-12">
        {/* Project Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Projet</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">{formData.title}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Catégorie</p>
            <p className="text-3xl font-headline font-extrabold text-primary capitalize">{formData.category}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Budget</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">
              {formData.budget_total.toLocaleString()} {formData.budget_currency}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Dates</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">
              {formData.start_date || "N/A"} — {formData.end_date || "N/A"}
            </p>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="border-t border-surface-container-high pt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
                <ImageIcon />
                Photos du projet
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Ajoutez des photos pour illustrer votre projet (optionnel)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={onImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-headline font-bold text-sm hover:bg-primary-container transition-colors shadow-lg shadow-primary/20"
            >
              <ImagePlus className="text-lg" />
              Ajouter des photos
            </button>
          </div>

          {imagePreviews.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-surface-container-high">
              <ImagePlus className="text-5xl text-on-surface-variant/30 mb-3" />
              <p className="text-sm font-medium text-on-surface-variant">
                Aucune photo ajoutée
              </p>
              <p className="text-xs text-on-surface-variant/60 mt-1">
                Cliquez sur &quot;Ajouter des photos&quot; pour uploader des images
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-surface-container-low border border-surface-container-high"
                >
                  <div className="relative w-full h-full">
                    <NextImage
                      src={preview}
                      alt={`Project image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="text-red-600 text-sm" />
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="text-xs fill-current" />
                      Principale
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
