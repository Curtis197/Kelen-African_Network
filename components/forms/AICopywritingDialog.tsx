"use client";

import { useState } from "react";
import { generateBioCopy } from "@/lib/actions/ai-copywriting";
import { X, Wand2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface AICopywritingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  category: string;
  onGenerated: (accroche: string, presentation: string) => void;
}

const VALUES = [
  "Honnêteté", "Rigueur", "Ponctualité", "Transparence",
  "Excellence", "Discrétion", "Engagement", "Simplicité",
];

const QUALITIES = [
  "Ponctualité", "Qualité des finitions", "Écoute", "Conseil",
  "Réactivité", "Respect du budget", "Accompagnement", "Fiabilité",
];

const RELATIONSHIP_STYLES = [
  { value: "hands_on", label: "Présent sur le terrain" },
  { value: "collaborative", label: "Collaboratif et consultatif" },
  { value: "turnkey", label: "Clé en main autonome" },
  { value: "educative", label: "Pédagogue et formateur" },
];

const COMMUNICATION_FREQS = [
  { value: "daily", label: "Rapports quotidiens" },
  { value: "weekly", label: "Mises à jour hebdomadaires" },
  { value: "milestone", label: "À chaque étape clé" },
  { value: "on_demand", label: "Sur demande du client" },
];

export default function AICopywritingDialog({
  isOpen,
  onClose,
  businessName,
  category,
  onGenerated,
}: AICopywritingDialogProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<string[]>([]);
  const [qualities, setQualities] = useState<string[]>([]);
  const [relationshipStyle, setRelationshipStyle] = useState("");
  const [communicationFreq, setCommunicationFreq] = useState("");
  const [proudestProject, setProudestProject] = useState("");
  const [limitsRefused, setLimitsRefused] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const reset = () => {
    setStep(0);
    setValues([]);
    setQualities([]);
    setRelationshipStyle("");
    setCommunicationFreq("");
    setProudestProject("");
    setLimitsRefused([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleValue = (v: string) => {
    if (values.includes(v)) {
      setValues(values.filter(x => x !== v));
    } else if (values.length < 3) {
      setValues([...values, v]);
    }
  };

  const toggleQuality = (q: string) => {
    if (qualities.includes(q)) {
      setQualities(qualities.filter(x => x !== q));
    } else if (qualities.length < 3) {
      setQualities([...qualities, q]);
    }
  };

  const handleGenerate = async () => {
    if (values.length === 0 || qualities.length === 0 || !relationshipStyle || !communicationFreq) {
      toast.error("Veuillez remplir toutes les sections obligatoires.");
      return;
    }

    setIsGenerating(true);
    const result = await generateBioCopy({
      values,
      qualities,
      relationshipStyle,
      communicationFreq,
      proudestProject: proudestProject || undefined,
      limitsRefused: limitsRefused.length > 0 ? limitsRefused : undefined,
      businessName,
      category,
    });
    setIsGenerating(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      onGenerated(result.data.bio_accroche, result.data.bio_presentation);
      toast.success("Textes générés avec succès !");
      handleClose();
    }
  };

  if (!isOpen) return null;

  const steps = [
    { label: "Valeurs", done: values.length > 0 },
    { label: "Qualités", done: qualities.length > 0 },
    { label: "Relation", done: !!relationshipStyle && !!communicationFreq },
    { label: "Générer", done: false },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-surface-container-low dark:bg-surface-container-low rounded-[2rem] p-6 sm:p-8 w-full max-w-lg space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Générer le texte avec l'IA"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">Générer avec l'IA</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-surface-container transition-colors" aria-label="Fermer">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-surface-container-high"}`} />
              {s.done && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 0: Values */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-1">Vos valeurs personnelles</h3>
              <p className="text-xs text-on-surface-variant mb-3">Sélectionnez maximum 3 valeurs</p>
              <div className="flex flex-wrap gap-2">
                {VALUES.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleValue(v)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      values.includes(v)
                        ? "bg-primary/10 text-primary border-2 border-primary"
                        : "bg-surface-container text-on-surface-variant border-2 border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm"
            >
              Suivant
            </button>
          </div>
        )}

        {/* Step 1: Qualities */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-1">Vos qualités professionnelles</h3>
              <p className="text-xs text-on-surface-variant mb-3">Sélectionnez maximum 3 qualités</p>
              <div className="flex flex-wrap gap-2">
                {QUALITIES.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleQuality(q)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      qualities.includes(q)
                        ? "bg-primary/10 text-primary border-2 border-primary"
                        : "bg-surface-container text-on-surface-variant border-2 border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)} className="px-6 py-3 rounded-xl font-semibold text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high">
                Retour
              </button>
              <button type="button" onClick={() => setStep(2)} className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Relationship style + communication */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">Style de relation client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RELATIONSHIP_STYLES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setRelationshipStyle(s.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                      relationshipStyle === s.value
                        ? "bg-primary/10 text-primary border-2 border-primary"
                        : "bg-surface-container text-on-surface-variant border-2 border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">Fréquence de communication</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMUNICATION_FREQS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setCommunicationFreq(f.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                      communicationFreq === f.value
                        ? "bg-primary/10 text-primary border-2 border-primary"
                        : "bg-surface-container text-on-surface-variant border-2 border-transparent hover:bg-surface-container-high"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">Projet le plus fier (optionnel)</h3>
              <textarea
                value={proudestProject}
                onChange={(e) => setProudestProject(e.target.value)}
                placeholder="Décrivez le projet dont vous êtes le plus fier..."
                rows={2}
                maxLength={500}
                className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-semibold text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high">
                Retour
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generate */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-surface-container rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-on-surface">Récapitulatif</h3>
              <p className="text-xs text-on-surface-variant"><span className="font-medium">Valeurs:</span> {values.join(", ")}</p>
              <p className="text-xs text-on-surface-variant"><span className="font-medium">Qualités:</span> {qualities.join(", ")}</p>
              <p className="text-xs text-on-surface-variant"><span className="font-medium">Relation:</span> {RELATIONSHIP_STYLES.find(s => s.value === relationshipStyle)?.label}</p>
              <p className="text-xs text-on-surface-variant"><span className="font-medium">Communication:</span> {COMMUNICATION_FREQS.find(f => f.value === communicationFreq)?.label}</p>
              {proudestProject && <p className="text-xs text-on-surface-variant"><span className="font-medium">Projet fier:</span> {proudestProject}</p>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-xl font-semibold text-sm text-on-surface-variant bg-surface-container hover:bg-surface-container-high">
                Retour
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Générer mes textes</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
