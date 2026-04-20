import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { html } = await req.json();
  if (!html || typeof html !== "string") {
    return NextResponse.json({ error: "Contenu manquant" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `Tu es un correcteur de texte professionnel spécialisé dans les newsletters d'entreprise en français.
Ta tâche est de corriger et d'améliorer le contenu HTML d'une newsletter.

Règles strictes :
- Corrige les fautes d'orthographe, de grammaire et de ponctuation
- Améliore le style et la clarté pour un ton professionnel et chaleureux
- Conserve TOUS les tags HTML tels quels (balises, attributs, structure)
- Ne supprime aucun contenu, ne rajoute pas de nouveau paragraphe
- Réponds UNIQUEMENT avec le HTML corrigé, sans commentaire ni explication
- Ne mets pas le HTML dans un bloc markdown (\`\`\`html), retourne-le directement`,
    messages: [
      {
        role: "user",
        content: `Corrige ce contenu HTML de newsletter :\n\n${html}`,
      },
    ],
  });

  const corrected = message.content[0].type === "text" ? message.content[0].text.trim() : html;
  return NextResponse.json({ html: corrected });
}
