'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { LogFormData, LogMedia } from '@/lib/types/daily-logs';
import { createLog } from '@/lib/actions/daily-logs';
import { uploadLogMedia } from '@/lib/actions/log-media';
import { saveDraft, getFormState, clearFormState, markDraftPendingSync, saveFormState } from '@/lib/utils/daily-log-drafts';
import PhotoUpload from './PhotoUpload';
import WeatherIcon from './WeatherIcon';
import OfflineIndicator from './OfflineIndicator';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { toast } from 'sonner';

interface LogFormProps {
  projectId: string;
  proProjectId?: string;
  stepId?: string;
  projectCurrency: 'XOF' | 'EUR' | 'USD';
  onSaved?: () => void;
}

const defaultFormData = (currency: 'XOF' | 'EUR' | 'USD'): LogFormData => ({
  logDate: new Date().toISOString().split('T')[0],
  title: '',
  description: '',
  moneySpent: 0,
  moneyCurrency: currency,
  paymentId: null,
  issues: '',
  nextSteps: '',
  weather: null,
  gpsLatitude: null,
  gpsLongitude: null,
  gpsSource: null,
  photos: [],
});

export default function LogForm({ projectId, proProjectId, stepId, projectCurrency, onSaved }: LogFormProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [formData, setFormData] = useState<LogFormData>(defaultFormData(projectCurrency));
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Auto-save form state on every keystroke (debounced 500ms)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      await saveFormState(projectId, formData);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [formData, projectId]);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      const saved = await getFormState(projectId);
      if (saved) {
        setFormData(prev => ({ ...prev, ...saved }));
      }
    };
    loadDraft();
  }, [projectId]);

  const handleGPSChange = useCallback((lat: number | null, lng: number | null, source: 'exif' | 'browser' | 'manual' | null) => {
    setFormData(prev => ({
      ...prev,
      gpsLatitude: lat,
      gpsLongitude: lng,
      gpsSource: source,
    }));
  }, []);

  const handleEXIFGPS = useCallback((lat: number | null, lng: number | null) => {
    setFormData(prev => ({
      ...prev,
      gpsLatitude: lat,
      gpsLongitude: lng,
      gpsSource: lat !== null ? 'exif' : null,
    }));
  }, []);

  const handlePhotosChange = useCallback((photos: LogMedia[]) => {
    setFormData(prev => ({ ...prev, photos }));
  }, []);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const id = await saveDraft(projectId, formData, draftId || undefined);
    setDraftId(id);
    await markDraftPendingSync(id, true);
    setIsSavingDraft(false);
    toast.success('Brouillon sauvegardé');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    if (formData.description.length < 50) {
      toast.error('La description doit contenir au moins 50 caractères');
      return;
    }
    // GPS is now optional - will come from photo EXIF

    setIsSubmitting(true);

    try {
      // Create log entry
      const result = await createLog({
        projectId: proProjectId || projectId,
        isProProject: !!proProjectId,
        stepId,
        logDate: formData.logDate,
        title: formData.title,
        description: formData.description,
        moneySpent: formData.moneySpent,
        moneyCurrency: formData.moneyCurrency,
        paymentId: formData.paymentId || undefined,
        issues: formData.issues || undefined,
        nextSteps: formData.nextSteps || undefined,
        weather: formData.weather || undefined,
        gpsLatitude: formData.gpsLatitude,
        gpsLongitude: formData.gpsLongitude,
      });

      if (result.error || !result.data) {
        toast.error(result.error || 'Erreur lors de la création du rapport');
        setIsSubmitting(false);
        return;
      }

      const logId = result.data.id;

      // Upload photos if any
      if (photoFiles.length > 0) {
        const mediaFormData = new FormData();
        photoFiles.forEach((file) => {
          mediaFormData.append('photos', file);
        });

        await uploadLogMedia(logId, projectId, mediaFormData);
      }

      // Clear draft
      await clearFormState(projectId);
      if (draftId) {
        await markDraftPendingSync(draftId, false);
      }

      toast.success('Rapport publié avec succès');

      if (onSaved) {
        onSaved();
      } else {
        router.push(`/pro/projets/${projectId}/journal`);
        router.refresh();
      }
    } catch (err) {
      toast.error('Erreur inattendue');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const weatherOptions: Array<{ value: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'cold'; label: string }> = [
    { value: 'sunny', label: 'Ensoleillé' },
    { value: 'cloudy', label: 'Nuageux' },
    { value: 'rainy', label: 'Pluvieux' },
    { value: 'stormy', label: 'Orageux' },
    { value: 'cold', label: 'Froid' },
  ];

  return (
    <>
      <OfflineIndicator />

      <form onSubmit={handleSubmit} className="max-w-[800px] mx-auto space-y-8 px-4 py-6">
        {/* Date */}
        <div>
          <label htmlFor="log-date" className="block text-sm font-medium text-on-surface mb-2">
            📅 Date
          </label>
          <input
            id="log-date"
            type="date"
            value={formData.logDate}
            onChange={(e) => setFormData(prev => ({ ...prev, logDate: e.target.value }))}
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
            required
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="log-title" className="block text-sm font-medium text-on-surface mb-2">
            🏷️ Titre du rapport
          </label>
          <input
            id="log-title"
            type="text"
            placeholder="Ex: Coulage des fondations"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            maxLength={200}
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="log-description" className="block text-sm font-medium text-on-surface mb-2">
            📝 Description
          </label>
          <textarea
            id="log-description"
            placeholder="Décrivez le travail effectué aujourd'hui..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={6}
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
            required
          />
          <p className="text-xs text-on-surface-variant/60 mt-1">
            {formData.description.length}/50 caractères minimum
          </p>
        </div>

        {/* Money */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            💰 Dépenses du jour
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.moneySpent || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, moneySpent: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
              aria-label="Montant dépensé"
            />
            <select
              value={formData.moneyCurrency}
              onChange={(e) => setFormData(prev => ({ ...prev, moneyCurrency: e.target.value as 'XOF' | 'EUR' | 'USD' }))}
              className="px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface"
              aria-label="Devise"
            >
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Issues */}
        <div>
          <label htmlFor="log-issues" className="block text-sm font-medium text-on-surface mb-2">
            ⚠️ Problèmes rencontrés (optionnel)
          </label>
          <textarea
            id="log-issues"
            placeholder="Décrivez les problèmes éventuels..."
            value={formData.issues}
            onChange={(e) => setFormData(prev => ({ ...prev, issues: e.target.value }))}
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
          />
        </div>

        {/* Next steps */}
        <div>
          <label htmlFor="log-next-steps" className="block text-sm font-medium text-on-surface mb-2">
            📋 Prochaines étapes (optionnel)
          </label>
          <textarea
            id="log-next-steps"
            placeholder="Travail prévu pour les prochains jours..."
            value={formData.nextSteps}
            onChange={(e) => setFormData(prev => ({ ...prev, nextSteps: e.target.value }))}
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
          />
        </div>

        {/* Weather */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-2">
            🌤️ Météo (optionnel)
          </label>
          <div className="flex flex-wrap gap-3">
            {weatherOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  weather: prev.weather === option.value ? null : option.value,
                }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  formData.weather === option.value
                    ? 'bg-primary/10 text-primary border-2 border-primary'
                    : 'bg-surface-container text-on-surface-variant border-2 border-transparent hover:bg-surface-container-high'
                }`}
                aria-pressed={formData.weather === option.value}
              >
                <WeatherIcon weather={option.value} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <PhotoUpload
          photos={formData.photos}
          photoFiles={photoFiles}
          onPhotosChange={handlePhotosChange}
          onPhotoFilesChange={setPhotoFiles}
          onEXIFGPS={handleEXIFGPS}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : '💾 Brouillon'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isOnline}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-on-primary bg-primary hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Publier le rapport'
            )}
          </button>
        </div>
      </form>
    </>
  );
}
