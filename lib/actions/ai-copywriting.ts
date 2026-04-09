"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CopywritingQuestionnaire {
  values: string[];          // Personal values (max 3)
  qualities: string[];       // Professional qualities (max 3)
  relationshipStyle: string;  // Client relationship style
  communicationFreq: string;  // Communication frequency
  proudestProject?: string;   // Project they're most proud of
  limitsRefused?: string[];   // Limits they refuse
  businessName: string;
  category: string;
}

interface GeneratedCopy {
  bio_accroche: string;    // 1-sentence hero tagline
  bio_presentation: string; // 3-5 sentences about section
}

export async function generateBioCopy(
  q: CopywritingQuestionnaire
): Promise<{ data?: GeneratedCopy; error?: string }> {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "Vous devez être connecté" };
  }

  // Verify user is a professional
  const { data: professional } = await supabase
    .from("professionals")
    .select("id, user_id")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return { error: "Profil professionnel introuvable" };
  }

  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "Clé API non configurée" };
  }

  try {
    const systemPrompt = `Tu es un rédacteur professionnel expert pour une plateforme africaine de services. Tu rédiges des textes en français pour des professionnels du bâtiment, de la rénovation et des services en Afrique.

RÈGLES:
- Un ton professionnel, chaleureux et authentique
- Pas de jargon technique
- Des phrases courtes et percutantes
- Mettre en avant l'expertise et la fiabilité
- Adapter le ton au secteur d'activité`;

    const userPrompt = `Rédige deux textes pour le profil d'un professionnel sur Kelen:

INFORMATIONS:
- Entreprise: ${q.businessName}
- Secteur: ${q.category}
- Valeurs: ${q.values.join(", ")}
- Qualités pro: ${q.qualities.join(", ")}
- Style relation client: ${q.relationshipStyle}
- Fréquence de communication: ${q.communicationFreq}
${q.proudestProject ? `- Projet le plus fier: ${q.proudestProject}` : ""}
${q.limitsRefused && q.limitsRefused.length > 0 ? `- Limites refusées: ${q.limitsRefused.join(", ")}` : ""}

RÉPONSES ATTENDUES (format JSON strict):
{
  "bio_accroche": "1 phrase courte et percutante pour la section hero (max 80 caractères). Doit capturer l'essence du métier et inspirer confiance.",
  "bio_presentation": "3 à 5 phrases pour la section À propos. Présente la philosophie de travail, l'expertise, et ce qui différencie ce professionnel. Pas de liste de services — c'est une présentation narrative."
}

Génère UNIQUEMENT le JSON valide, sans texte avant ou après.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: "Format de réponse invalide. Veuillez réessayer." };
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedCopy;

    // Validate
    if (!parsed.bio_accroche || !parsed.bio_presentation) {
      return { error: "Réponse incomplète. Veuillez réessayer." };
    }

    if (parsed.bio_accroche.length > 200) {
      return { error: "L'accroche est trop longue (max 200 caractères)." };
    }

    // Save to professional's profile
    const { error: updateError } = await supabase
      .from("professionals")
      .update({
        bio_accroche: parsed.bio_accroche,
        about_text: parsed.bio_presentation,
      })
      .eq("id", professional.id);

    if (updateError) {
      console.error("Error saving AI copy:", updateError);
      return { error: "Erreur lors de la sauvegarde des textes" };
    }

    revalidatePath("/pro/profil");
    return { data: parsed };
  } catch (err) {
    console.error("AI copywriting error:", err);
    if (err instanceof Error && err.message.includes("API key")) {
      return { error: "Clé API non configurée. Contactez l'administrateur." };
    }
    return { error: "Erreur lors de la génération. Veuillez réessayer." };
  }
}
