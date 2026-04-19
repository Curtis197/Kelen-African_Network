// lib/portfolio/copy-generator.ts
// Server-only: imports Anthropic SDK. Never import this from a client component.
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { CopyAnswers, ProContext, GeneratedCopy } from "./copy-questions";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generatePortfolioCopy(
  answers: CopyAnswers,
  pro: ProContext,
): Promise<GeneratedCopy> {
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

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(text.trim()) as GeneratedCopy;

  return parsed;
}
