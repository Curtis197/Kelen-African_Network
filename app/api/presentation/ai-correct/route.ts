import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { text, context } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Contenu manquant" }, { status: 400 });
  }

  const contextLabel = context === "product" ? "d'un produit" : "d'un service";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `Tu es un correcteur de texte professionnel spécialisé dans les descriptions ${contextLabel} pour des professionnels africains.
Ta tâche est de corriger et d'améliorer une description en texte brut.

Règles strictes :
- Corrige les fautes d'orthographe, de grammaire et de ponctuation
- Améliore le style et la clarté pour un ton professionnel et commercial
- Conserve le sens original et toutes les informations importantes
- Ne supprime aucune information clé, ne rajoute pas de contenu inventé
- Réponds UNIQUEMENT avec le texte corrigé, sans commentaire ni explication`,
    messages: [
      {
        role: "user",
        content: `Corrige cette description ${contextLabel} :\n\n${text}`,
      },
    ],
  });

  const corrected = message.content[0].type === "text" ? message.content[0].text.trim() : text;
  return NextResponse.json({ text: corrected });
}
