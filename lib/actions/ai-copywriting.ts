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
    return { error: "Vous devez Ãªtre connectÃ©" };
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
    return { error: "ClÃ© API non configurÃ©e" };
  }

  try {
    const systemPrompt = `Tu es un rÃ©dacteur professionnel expert pour une plateforme africaine de services. Tu rÃ©diges des textes en franÃ§ais pour des professionnels du bÃ¢timent, de la rÃ©novation et des services en Afrique.

RÃˆGLES:
- Un ton professionnel, chaleureux et authentique
- Pas de jargon technique
- Des phrases courtes et percutantes
- Mettre en avant l'expertise et la fiabilitÃ©
- Adapter le ton au secteur d'activitÃ©`;

    const userPrompt = `RÃ©dige deux textes pour le profil d'un professionnel sur Kelen:

INFORMATIONS:
- Entreprise: ${q.businessName}
- Secteur: ${q.category}
- Valeurs: ${q.values.join(", ")}
- QualitÃ©s pro: ${q.qualities.join(", ")}
- Style relation client: ${q.relationshipStyle}
- FrÃ©quence de communication: ${q.communicationFreq}
${q.proudestProject ? `- Projet le plus fier: ${q.proudestProject}` : ""}
${q.limitsRefused && q.limitsRefused.length > 0 ? `- Limites refusÃ©es: ${q.limitsRefused.join(", ")}` : ""}

RÃ‰PONSES ATTENDUES (format JSON strict):
{
  "bio_accroche": "1 phrase courte et percutante pour la section hero (max 80 caractÃ¨res). Doit capturer l'essence du mÃ©tier et inspirer confiance.",
  "bio_presentation": "3 Ã  5 phrases pour la section Ã€ propos. PrÃ©sente la philosophie de travail, l'expertise, et ce qui diffÃ©rencie ce professionnel. Pas de liste de services â€” c'est une prÃ©sentation narrative."
}

GÃ©nÃ¨re UNIQUEMENT le JSON valide, sans texte avant ou aprÃ¨s.`;

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
      return { error: "Format de rÃ©ponse invalide. Veuillez rÃ©essayer." };
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedCopy;

    // Validate
    if (!parsed.bio_accroche || !parsed.bio_presentation) {
      return { error: "RÃ©ponse incomplÃ¨te. Veuillez rÃ©essayer." };
    }

    if (parsed.bio_accroche.length > 200) {
      return { error: "L'accroche est trop longue (max 200 caractÃ¨res)." };
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
      return { error: "Erreur lors de la sauvegarde des textes" };
    }

    revalidatePath("/pro/profil");
    return { data: parsed };
  } catch (err) {
    if (err instanceof Error && err.message.includes("API key")) {
      return { error: "ClÃ© API non configurÃ©e. Contactez l'administrateur." };
    }
    return { error: "Erreur lors de la gÃ©nÃ©ration. Veuillez rÃ©essayer." };
  }
}
