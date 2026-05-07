// components/portfolio/StyleQuiz.tsx
"use client";

import { useState } from "react";
import { STYLE_QUESTIONS } from "@/lib/portfolio/style-tokens";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import { saveStyleQuiz } from "@/lib/actions/portfolio-site";

interface Props {
  initialAnswers: Partial<StyleAnswers>;
  onAnswersChange: (answers: Partial<StyleAnswers>) => void;
  hasBrandColor?: boolean;
  brandPrimary?: string | null;
}

export function StyleQuiz({ initialAnswers, onAnswersChange, hasBrandColor = false, brandPrimary }: Props) {
  const [answers, setAnswers] = useState<Partial<StyleAnswers>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSelect(questionId: string, value: string) {
    const next = { ...answers, [questionId]: value } as Partial<StyleAnswers>;
    setAnswers(next);
    onAnswersChange(next);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveStyleQuiz(answers as StyleAnswers);
      setSaved(true);
    } catch (e) {
    } finally {
      setSaving(false);
    }
  }

  const allAnswered = STYLE_QUESTIONS.every(q => answers[q.id as keyof StyleAnswers]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface">Style visuel</h3>
        <p className="text-sm text-on-surface-variant/70 mt-1">
          4 questions pour personnaliser l'apparence de votre site.
        </p>
      </div>

      {STYLE_QUESTIONS.map((question) => (
        <div key={question.id} className="space-y-3">
          <p className="font-semibold text-sm text-on-surface">{question.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {question.options.map((option) => {
              const selected = answers[question.id as keyof StyleAnswers] === option.value;
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

            {/* Logo-color option — only on the mood question */}
            {question.id === "mood" && (
              <button
                key="logo-color"
                disabled={!hasBrandColor}
                onClick={() => hasBrandColor && handleSelect("mood", "logo-color")}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-150 relative ${
                  answers.mood === "logo-color"
                    ? "border-kelen-green-600 bg-kelen-green-50"
                    : hasBrandColor
                    ? "border-outline-variant/30 hover:border-kelen-green-300 hover:bg-surface-container-low"
                    : "border-outline-variant/20 opacity-50 cursor-not-allowed"
                }`}
              >
                {brandPrimary && (
                  <span
                    className="absolute top-3 right-3 w-3 h-3 rounded-full border border-white/50 shadow-sm"
                    style={{ background: brandPrimary }}
                  />
                )}
                <p className="font-bold text-sm text-on-surface">Couleur du logo</p>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">
                  {hasBrandColor ? "Teinte issue de votre marque" : "Téléversez votre logo d'abord"}
                </p>
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={!allAnswered || saving}
        className="h-11 px-6 rounded-xl bg-kelen-green-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-kelen-green-700 transition-colors"
      >
        {saving ? "Enregistrement..." : saved ? "Enregistré âœ"" : "Enregistrer le style"}
      </button>
    </div>
  );
}
