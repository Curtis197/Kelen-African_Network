// lib/portfolio/copy-questions.ts
// Client-safe: no server-only imports. Used by CopywritingQuiz and server actions.

export const COPY_QUESTIONS = [
  {
    id: "tone",
    label: "Comment voulez-vous paraître ?",
    options: [
      { value: "professional", label: "Professionnel & sérieux",   description: "Rigueur & expertise" },
      { value: "warm",         label: "Chaleureux & accessible",   description: "Proche & à l'écoute" },
      { value: "bold",         label: "Audacieux & confiant",      description: "Impact & leadership" },
    ],
  },
  {
    id: "strength",
    label: "Votre force principale",
    options: [
      { value: "quality",      label: "Qualité du travail",              description: "Finitions impeccables" },
      { value: "reliability",  label: "Rapidité & fiabilité",            description: "Dans les délais, toujours" },
      { value: "experience",   label: "Expérience & expertise",          description: "Des années de savoir-faire" },
      { value: "value",        label: "Meilleur rapport qualité-prix",   description: "Excellence accessible" },
    ],
  },
  {
    id: "clientRelation",
    label: "Comment vous adressez-vous à vos clients ?",
    options: [
      { value: "formal",   label: "Formel",      description: '"Nous vous accompagnons"' },
      { value: "direct",   label: "Direct",      description: '"Appelez-moi"' },
      { value: "friendly", label: "Amical",      description: '"Parlons de votre projet"' },
    ],
  },
  {
    id: "differentiator",
    label: "Ce qui vous différencie (optionnel)",
    freeText: true,
    placeholder: "Ex: 20 ans sur Abidjan, spécialiste béton armé...",
  },
] as const;

export type CopyAnswers = {
  tone: "professional" | "warm" | "bold";
  strength: "quality" | "reliability" | "experience" | "value";
  clientRelation: "formal" | "direct" | "friendly";
  differentiator?: string;
};

export type ProContext = {
  businessName: string;
  category: string;
  city?: string;
  country?: string;
  yearsOfExperience?: number;
};

export type GeneratedCopy = {
  heroSubtitle: string;
  aboutText: string;
};
