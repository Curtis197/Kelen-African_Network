// lib/portfolio/copy-generator.ts
// Server-only. Uses Groq (free tier) for testing.
import "server-only";

import type { CopyAnswers, ProContext, GeneratedCopy } from "./copy-questions";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL   = "llama-3.1-8b-instant";

export async function generatePortfolioCopy(
  answers: CopyAnswers,
  pro: ProContext,
): Promise<GeneratedCopy> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set. Get a free key at console.groq.com");
  }

  const toneMap = {
    professional: "formel et expert, vouvoiement",
    warm: "chaleureux et humain, tutoiement possible",
    bold: "audacieux et direct, phrases courtes percutantes",
  };

  const strengthMap = {
    quality:     "la qualité irréprochable des finitions",
    reliability: "la rapidité et la fiabilité des délais",
    experience:  "l'expérience et le savoir-faire accumulés",
    value:       "le meilleur rapport qualité-prix du marché",
  };

  const clientMap = {
    formal:   '"Nous vous accompagnons" / "Notre équipe"',
    direct:   '"Appelez-moi" / "Je suis là pour vous"',
    friendly: '"Parlons de votre projet" / "Ensemble"',
  };

  const location = [pro.city, pro.country].filter(Boolean).join(", ");

  const prompt = `Tu es un rédacteur expert en marketing pour les professionnels africains.
Tu dois écrire le contenu d'un site portfolio pour ce professionnel.

PROFIL:
- Nom: ${pro.businessName}
- Métier: ${pro.category}
- Localisation: ${location || "Afrique"}
${pro.yearsOfExperience ? `- Expérience: ${pro.yearsOfExperience} ans` : ""}
${answers.differentiator ? `- Ce qui le différencie: ${answers.differentiator}` : ""}

STYLE SOUHAITÉ:
- Ton: ${toneMap[answers.tone]}
- Force mise en avant: ${strengthMap[answers.strength]}
- Formule client: ${clientMap[answers.clientRelation]}

RÈGLES:
- heroSubtitle: 1 phrase, max 12 mots, accroche forte, sans le nom de l'entreprise
- aboutText: 3-4 phrases naturelles, première personne, pas de clichés
- Écrire en français
- Ne pas mentionner "Kelen"
- Pas de bullet points, pas de titres dans aboutText

Réponds UNIQUEMENT avec ce JSON valide, rien d'autre:
{
  "heroSubtitle": "...",
  "aboutText": "..."
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(text.trim()) as GeneratedCopy;

  return parsed;
}
