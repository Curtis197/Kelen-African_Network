// lib/actions/realization-copy.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function correctRealizationText(data: {
  title: string;
  description: string;
}) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: pro } = await supabase
    .from("professionals")
    .select("category")
    .eq("user_id", user.id)
    .single();

  const prompt = `Tu es un rédacteur expert pour les professionnels africains.
Améliore le titre et la description de cette réalisation.
${pro?.category ? `Métier du professionnel : ${pro.category}` : ""}

TITRE ACTUEL : "${data.title}"
DESCRIPTION ACTUELLE : "${data.description || "(vide)"}"

RÈGLES :
- titre : court, percutant, commence par un verbe d'action ou un résultat concret (max 10 mots)
- description : 3-5 phrases fluides en première personne, mentionne les défis relevés et les résultats obtenus, pas de bullet points
- Corriger l'orthographe et la grammaire
- Écrire en français
- Ne pas mentionner "Kelen"
- Si la description est vide, génère-en une courte cohérente avec le titre

Réponds UNIQUEMENT avec ce JSON valide, rien d'autre :
{
  "title": "...",
  "description": "..."
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const groqData = await res.json();
  const text: string = groqData.choices?.[0]?.message?.content ?? "";
  const corrected = JSON.parse(text.trim()) as { title: string; description: string };

  return { corrected };
}

export async function saveRealizationCopy(
  id: string,
  data: { title: string; description: string },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!pro) throw new Error("Profil non trouvé");

  const { error } = await supabase
    .from("professional_realizations")
    .update({ title: data.title, description: data.description })
    .eq("id", id)
    .eq("professional_id", pro.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/pro/portfolio/${id}`);
  return { success: true };
}
