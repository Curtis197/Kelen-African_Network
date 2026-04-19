// components/portfolio/CopywritingQuiz.tsx
"use client";

import { useState } from "react";
import { COPY_QUESTIONS } from "@/lib/portfolio/copy-questions";
import type { CopyAnswers } from "@/lib/portfolio/copy-questions";
import { saveCopyQuizAndGenerate } from "@/lib/actions/portfolio-site";
import { Loader2 } from "lucide-react";

interface Props {
  initialAnswers: Partial<CopyAnswers>;
  onCopyGenerated: (copy: { heroSubtitle: string; aboutText: string }) => void;
}

export function CopywritingQuiz({ initialAnswers, onCopyGenerated }: Props) {
  console.log('[COMPONENT] CopywritingQuiz render:', { initialAnswers });
  const [answers, setAnswers] = useState<Partial<CopyAnswers>>(initialAnswers);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setGenerated(false);
    setError(null);
  }

  function handleFreeText(value: string) {
    setAnswers(prev => ({ ...prev, differentiator: value }));
    setGenerated(false);
  }

  const requiredQuestions = COPY_QUESTIONS.filter(q => !("freeText" in q));
  const allRequired = requiredQuestions.every(q => answers[q.id as keyof CopyAnswers]);

  async function handleGenerate() {
    console.log('[COMPONENT] CopywritingQuiz handleGenerate:', { answers });
    setGenerating(true);
    setError(null);
    try {
      const result = await saveCopyQuizAndGenerate(answers as CopyAnswers);
      onCopyGenerated(result.copy);
      setGenerated(true);
    } catch (e: any) {
      console.error('[COMPONENT] CopywritingQuiz handleGenerate error:', e);
      setError("Erreur lors de la génération. Réessayez.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface">Voix & Contenu</h3>
        <p className="text-sm text-on-surface-variant/70 mt-1">
          4 questions pour générer le texte de votre site automatiquement.
        </p>
      </div>

      {COPY_QUESTIONS.map((question) => {
        if ("freeText" in question) {
          return (
            <div key={question.id} className="space-y-2">
              <p className="font-semibold text-sm text-on-surface">
                {question.label}{" "}
                <span className="text-on-surface-variant/40 font-normal">(optionnel)</span>
              </p>
              <input
                type="text"
                placeholder={question.placeholder}
                value={(answers as any).differentiator ?? ""}
                onChange={e => handleFreeText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:border-kelen-green-500"
              />
            </div>
          );
        }

        return (
          <div key={question.id} className="space-y-3">
            <p className="font-semibold text-sm text-on-surface">{question.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {question.options.map((option) => {
                const selected = answers[question.id as keyof CopyAnswers] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(question.id, option.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                      selected
                        ? "border-kelen-green-600 bg-kelen-green-50"
                        : "border-outline-variant/30 hover:border-kelen-green-300 hover:bg-surface-container-low"
                    }`}
                  >
                    <p className="font-bold text-sm text-on-surface">{option.label}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={!allRequired || generating}
        className="h-11 px-6 rounded-xl bg-kelen-green-600 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kelen-green-700 transition-colors"
      >
        {generating && <Loader2 className="w-4 h-4 animate-spin" />}
        {generating ? "Génération en cours..." : generated ? "Texte généré ✓" : "Générer mon contenu"}
      </button>
    </div>
  );
}
