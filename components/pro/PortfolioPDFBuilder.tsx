"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileDown, Upload, X, CheckSquare, Square,
  Image as ImageIcon, FileText, Layers, ShoppingBag, Wrench, Save
} from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/supabase/storage";
import { updatePortfolioPDF } from "@/lib/actions/portfolio";

// ── Types ────────────────────────────────────────────────────────────────────

interface Realization {
  id: string;
  title: string;
  is_pdf_included: boolean;
  mainImage?: string | null;
  completion_date?: string | null;
}

interface Service {
  id: string;
  title: string;
  is_pdf_included: boolean;
  price?: string | null;
}

interface Product {
  id: string;
  title: string;
  is_pdf_included: boolean;
  price?: string | null;
}

interface Portfolio {
  cover_title?: string | null;
  hero_image_url?: string | null;
  hero_subtitle?: string | null;
  about_text?: string | null;
  about_image_url?: string | null;
}

interface Props {
  professional: { id: string; slug: string; businessName: string };
  portfolio: Portfolio | null;
  realizations: Realization[];
  services: Service[];
  products: Product[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kelen-green-50">
        <Icon className="w-4 h-4 text-kelen-green-600" />
      </div>
      <h2 className="font-headline text-lg font-bold text-on-surface">{title}</h2>
      {count && <span className="ml-auto text-sm font-medium text-on-surface-variant/60">{count}</span>}
    </div>
  );
}

function ImageUploadField({
  label, value, onChange, userId, uploading, setUploading, aspectRatio = "16/9"
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  aspectRatio?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, "portfolios", userId);
      onChange(url);
    } catch (err) {
      toast.error("Erreur lors du téléchargement de l'image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [userId, onChange, setUploading]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-on-surface">{label}</p>
      <div
        className="relative overflow-hidden rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest cursor-pointer hover:border-kelen-green-400 transition-colors"
        style={{ aspectRatio }}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-on-surface-variant/40">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-kelen-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImageIcon size={24} strokeWidth={1.5} />
                <span className="text-xs">{label}</span>
              </>
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function SelectionItem({
  id, title, subtitle, image, checked, onChange
}: {
  id: string; title: string; subtitle?: string | null;
  image?: string | null; checked: boolean; onChange: (id: string, v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors select-none ${
        checked
          ? "border-kelen-green-300 bg-kelen-green-50/50"
          : "border-outline-variant/20 bg-surface hover:bg-surface-container-low"
      }`}
    >
      <div className="shrink-0 text-kelen-green-600" onClick={() => onChange(id, !checked)}>
        {checked ? <CheckSquare size={20} /> : <Square size={20} className="text-on-surface-variant/30" />}
      </div>
      {image && (
        <img src={image} alt={title} className="h-10 w-14 rounded-lg object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface truncate">{title}</p>
        {subtitle && <p className="text-xs text-on-surface-variant/60 truncate">{subtitle}</p>}
      </div>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PortfolioPDFBuilder({ professional, portfolio, realizations, services, products }: Props) {
  const router = useRouter();

  // Cover state
  const [coverImageUrl, setCoverImageUrl] = useState(portfolio?.hero_image_url ?? null);
  const [coverTitle, setCoverTitle] = useState(portfolio?.cover_title ?? professional.businessName);
  const [coverSubtitle, setCoverSubtitle] = useState(portfolio?.hero_subtitle ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);

  // About state
  const [aboutText, setAboutText] = useState(portfolio?.about_text ?? "");
  const [aboutImageUrl, setAboutImageUrl] = useState(portfolio?.about_image_url ?? null);
  const [uploadingAbout, setUploadingAbout] = useState(false);

  // Selection state
  const [selectedRealizations, setSelectedRealizations] = useState<Set<string>>(
    new Set(realizations.filter(r => r.is_pdf_included).map(r => r.id))
  );
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(services.filter(s => s.is_pdf_included).map(s => s.id))
  );
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(products.filter(p => p.is_pdf_included).map(p => p.id))
  );

  const [saving, setSaving] = useState(false);

  const toggleItem = useCallback((set: Set<string>, setFn: (s: Set<string>) => void) =>
    (id: string, checked: boolean) => {
      const next = new Set(set);
      checked ? next.add(id) : next.delete(id);
      setFn(next);
    }, []);

  const toggleAll = (items: { id: string }[], set: Set<string>, setFn: (s: Set<string>) => void) => {
    const allSelected = items.every(i => set.has(i.id));
    setFn(allSelected ? new Set() : new Set(items.map(i => i.id)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePortfolioPDF({
        cover_title: coverTitle || null,
        hero_image_url: coverImageUrl,
        hero_subtitle: coverSubtitle || null,
        about_text: aboutText || null,
        about_image_url: aboutImageUrl,
        selected_realization_ids: Array.from(selectedRealizations),
        selected_service_ids: Array.from(selectedServices),
        selected_product_ids: Array.from(selectedProducts),
      });
      toast.success("Configuration sauvegardée");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const pdfUrl = `/api/portfolio-pdf?professional_id=${professional.id}`;
  const totalSelected =
    selectedRealizations.size + selectedServices.size + selectedProducts.size;

  return (
    <div className="space-y-8">
      {/* ── Cover ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/20 bg-surface p-6 space-y-5">
        <SectionHeader icon={FileText} title="Page de couverture" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ImageUploadField
            label="Image de couverture"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            userId={professional.id}
            uploading={uploadingCover}
            setUploading={setUploadingCover}
            aspectRatio="21/9"
          />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-on-surface">Titre</label>
              <input
                type="text"
                value={coverTitle}
                onChange={e => setCoverTitle(e.target.value)}
                placeholder={professional.businessName}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-kelen-green-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-on-surface">Sous-titre</label>
              <input
                type="text"
                value={coverSubtitle}
                onChange={e => setCoverSubtitle(e.target.value)}
                placeholder="Votre partenaire de confiance"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-kelen-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/20 bg-surface p-6 space-y-5">
        <SectionHeader icon={Layers} title="Page À propos" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ImageUploadField
            label="Photo à propos"
            value={aboutImageUrl}
            onChange={setAboutImageUrl}
            userId={professional.id}
            uploading={uploadingAbout}
            setUploading={setUploadingAbout}
            aspectRatio="4/3"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface">Texte de présentation</label>
            <textarea
              value={aboutText}
              onChange={e => setAboutText(e.target.value)}
              rows={6}
              placeholder="Décrivez votre activité, votre expertise..."
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-kelen-green-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      </section>

      {/* ── Réalisations ──────────────────────────────────── */}
      {realizations.length > 0 && (
        <section className="rounded-2xl border border-outline-variant/20 bg-surface p-6 space-y-4">
          <SectionHeader
            icon={ImageIcon}
            title="Réalisations"
            count={`${selectedRealizations.size}/${realizations.length} sélectionnée${selectedRealizations.size !== 1 ? "s" : ""}`}
          />
          <button
            type="button"
            className="text-xs font-semibold text-kelen-green-600 hover:underline"
            onClick={() => toggleAll(realizations, selectedRealizations, setSelectedRealizations)}
          >
            {realizations.every(r => selectedRealizations.has(r.id)) ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {realizations.map(r => (
              <SelectionItem
                key={r.id}
                id={r.id}
                title={r.title}
                subtitle={r.completion_date ? new Date(r.completion_date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : null}
                image={r.mainImage}
                checked={selectedRealizations.has(r.id)}
                onChange={toggleItem(selectedRealizations, setSelectedRealizations)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Services ──────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="rounded-2xl border border-outline-variant/20 bg-surface p-6 space-y-4">
          <SectionHeader
            icon={Wrench}
            title="Services"
            count={`${selectedServices.size}/${services.length} sélectionné${selectedServices.size !== 1 ? "s" : ""}`}
          />
          <button
            type="button"
            className="text-xs font-semibold text-kelen-green-600 hover:underline"
            onClick={() => toggleAll(services, selectedServices, setSelectedServices)}
          >
            {services.every(s => selectedServices.has(s.id)) ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {services.map(s => (
              <SelectionItem
                key={s.id}
                id={s.id}
                title={s.title}
                subtitle={s.price ? `À partir de ${s.price}` : null}
                checked={selectedServices.has(s.id)}
                onChange={toggleItem(selectedServices, setSelectedServices)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Produits ──────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="rounded-2xl border border-outline-variant/20 bg-surface p-6 space-y-4">
          <SectionHeader
            icon={ShoppingBag}
            title="Produits"
            count={`${selectedProducts.size}/${products.length} sélectionné${selectedProducts.size !== 1 ? "s" : ""}`}
          />
          <button
            type="button"
            className="text-xs font-semibold text-kelen-green-600 hover:underline"
            onClick={() => toggleAll(products, selectedProducts, setSelectedProducts)}
          >
            {products.every(p => selectedProducts.has(p.id)) ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {products.map(p => (
              <SelectionItem
                key={p.id}
                id={p.id}
                title={p.title}
                subtitle={p.price ? p.price : null}
                checked={selectedProducts.has(p.id)}
                onChange={toggleItem(selectedProducts, setSelectedProducts)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Footer actions ────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
        <p className="text-sm text-on-surface-variant/70">
          <span className="font-semibold text-on-surface">{totalSelected}</span> élément{totalSelected !== 1 ? "s" : ""} inclus dans le PDF
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-xl border border-kelen-green-600 px-5 text-sm font-bold text-kelen-green-600 transition-all hover:bg-kelen-green-50 disabled:opacity-40"
          >
            <Save size={16} />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-kelen-green-600 to-kelen-green-500 px-5 text-sm font-bold text-white shadow-[0_6px_12px_-3px_rgba(0,150,57,0.25)] transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <FileDown size={16} />
            Télécharger PDF
          </a>
        </div>
      </div>
    </div>
  );
}
