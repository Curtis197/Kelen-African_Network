// lib/actions/portfolio-site.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePortfolioCopy } from "@/lib/portfolio/copy-generator";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import type { CopyAnswers } from "@/lib/portfolio/copy-questions";
import type { ColorMode } from "@/lib/pro-site/types";
import { revalidatePath } from "next/cache";

async function getProfessional() {
  console.log('[ACTION] getProfessional: start');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  console.log('[AUTH] getProfessional: user found', { userId: user.id });

  const { data: pro, error } = await supabase
    .from("professionals")
    .select("id, slug, business_name, category, city, country, years_experience")
    .eq("user_id", user.id)
    .single();

  console.log('[DB] getProfessional professionals query:', {
    hasData: !!pro,
    hasError: !!error,
    errorMessage: error?.message,
    errorCode: error?.code,
  });
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professionals, User:', user.id);
  }

  if (!pro) throw new Error("Profil professionnel non trouvé");
  console.log('[ACTION] getProfessional: done', { proId: pro.id, slug: pro.slug });
  return { supabase, pro };
}

function toCornerStyle(imageShape?: string) {
  if (imageShape === "sharp") return "square";
  if (imageShape === "pill") return "rounded";
  return "half-rounded";
}

function toColorMode(mood?: string) {
  if (mood === "dark") return "dark";
  if (mood === "warm") return "warm";
  if (mood === "logo-color") return "logo-color";
  return "light";
}

export async function saveStyleQuiz(answers: StyleAnswers) {
  console.log('[ACTION] saveStyleQuiz: start', { answers });
  const { supabase, pro } = await getProfessional();

  const { data, error } = await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: pro.id,
        style_tokens: answers,
        corner_style: toCornerStyle(answers.imageShape),
        color_mode: toColorMode(answers.mood),
        image_weight: answers.imageWeight,
        spacing: answers.spacing,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    )
    .select();

  console.log('[DB] saveStyleQuiz upsert:', {
    hasData: !!data,
    rowCount: data?.length,
    hasError: !!error,
    errorMessage: error?.message,
    errorCode: error?.code,
  });
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professional_portfolio, User:', pro.id);
  }
  if (!error && (!data || data.length === 0)) {
    console.warn('[RLS] ⚠️ POTENTIAL SILENT RLS FILTERING Table: professional_portfolio');
  }

  if (error) throw new Error(error.message);
  revalidatePath(`/professionnels/${pro.slug}`);
  console.log('[ACTION] saveStyleQuiz: done');
  return { success: true };
}

export async function saveCopyQuizAndGenerate(answers: CopyAnswers) {
  console.log('[ACTION] saveCopyQuizAndGenerate: start', { answers });
  const { supabase, pro } = await getProfessional();

  const copy = await generatePortfolioCopy(answers, {
    businessName: pro.business_name,
    category: pro.category,
    city: pro.city,
    country: pro.country,
    yearsOfExperience: pro.years_experience,
  });
  console.log('[ACTION] saveCopyQuizAndGenerate: Claude generated copy', {
    heroSubtitleLength: copy.heroSubtitle?.length,
    aboutTextLength: copy.aboutText?.length,
  });

  const { data, error } = await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: pro.id,
        copy_quiz_answers: answers,
        hero_subtitle: copy.heroSubtitle,
        about_text: copy.aboutText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    )
    .select();

  console.log('[DB] saveCopyQuizAndGenerate upsert:', {
    hasData: !!data,
    rowCount: data?.length,
    hasError: !!error,
    errorMessage: error?.message,
    errorCode: error?.code,
  });
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professional_portfolio, User:', pro.id);
  }
  if (!error && (!data || data.length === 0)) {
    console.warn('[RLS] ⚠️ POTENTIAL SILENT RLS FILTERING Table: professional_portfolio');
  }

  if (error) throw new Error(error.message);
  revalidatePath(`/professionnels/${pro.slug}`);
  console.log('[ACTION] saveCopyQuizAndGenerate: done');
  return { success: true, copy };
}

export async function correctCopyWithAI(data: { heroSubtitle: string; aboutText: string }) {
  console.log('[ACTION] correctCopyWithAI: start');
  const { supabase, pro } = await getProfessional();

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");

  const { data: portfolio } = await supabase
    .from("professional_portfolio")
    .select("copy_quiz_answers")
    .eq("professional_id", pro.id)
    .single();

  const tone = (portfolio?.copy_quiz_answers as any)?.tone ?? "professional";
  const toneMap: Record<string, string> = {
    professional: "formel et expert",
    warm: "chaleureux et humain",
    bold: "audacieux et direct, phrases courtes",
  };

  const prompt = `Tu es un correcteur-rédacteur expert pour les professionnels africains.
Améliore les textes suivants pour ce professionnel :
- Métier : ${pro.category}
- Ton souhaité : ${toneMap[tone] ?? toneMap.professional}

TEXTE ACTUEL :
heroSubtitle : "${data.heroSubtitle}"
aboutText : "${data.aboutText}"

RÈGLES :
- heroSubtitle : max 12 mots, percutant, sans le nom de l'entreprise
- aboutText : 3-4 phrases naturelles, première personne, pas de clichés, pas de bullet points
- Corriger l'orthographe, améliorer le style, garder le sens original
- Écrire en français
- Ne pas mentionner "Kelen"

Réponds UNIQUEMENT avec ce JSON valide, rien d'autre :
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
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const groqData = await res.json();
  const text: string = groqData.choices?.[0]?.message?.content ?? "";
  const corrected = JSON.parse(text.trim()) as { heroSubtitle: string; aboutText: string };

  console.log('[ACTION] correctCopyWithAI: done');
  return { success: true, corrected };
}

export async function saveCopyManually(data: { heroSubtitle: string; aboutText: string }) {
  console.log('[ACTION] saveCopyManually: start', { heroSubtitleLength: data.heroSubtitle?.length, aboutTextLength: data.aboutText?.length });
  const { supabase, pro } = await getProfessional();

  const { data: result, error } = await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: pro.id,
        hero_subtitle: data.heroSubtitle,
        about_text: data.aboutText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    )
    .select();

  console.log('[DB] saveCopyManually upsert:', {
    hasData: !!result,
    rowCount: result?.length,
    hasError: !!error,
    errorMessage: error?.message,
    errorCode: error?.code,
  });
  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professional_portfolio, User:', pro.id);
  }
  if (!error && (!result || result.length === 0)) {
    console.warn('[RLS] ⚠️ POTENTIAL SILENT RLS FILTERING Table: professional_portfolio');
  }

  if (error) throw new Error(error.message);
  revalidatePath(`/professionnels/${pro.slug}`);
  console.log('[ACTION] saveCopyManually: done');
  return { success: true };
}

export async function saveAboutText(data: { aboutText: string; aboutImageUrl?: string | null }) {
  console.log('[ACTION] saveAboutText: start', { aboutTextLength: data.aboutText?.length });
  const { supabase, pro } = await getProfessional();

  const payload: Record<string, unknown> = {
    professional_id: pro.id,
    about_text: data.aboutText,
    updated_at: new Date().toISOString(),
  };
  if (data.aboutImageUrl !== undefined) {
    payload.about_image_url = data.aboutImageUrl;
  }

  const { error } = await supabase
    .from("professional_portfolio")
    .upsert(payload, { onConflict: "professional_id" });

  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING! Table: professional_portfolio, User:', pro.id);
    throw new Error(error.message);
  }
  if (error) throw new Error(error.message);

  revalidatePath(`/professionnels/${pro.slug}`);
  revalidatePath(`/professionnels/${pro.slug}/a-propos`);
  console.log('[ACTION] saveAboutText: done');
  return { success: true };
}

export async function saveBrandTheme(colorMode: ColorMode) {
  const { supabase, pro } = await getProfessional();
  const { error } = await supabase
    .from("professional_portfolio")
    .upsert(
      { professional_id: pro.id, color_mode: colorMode, updated_at: new Date().toISOString() },
      { onConflict: "professional_id" }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/professionnels/${pro.slug}`);
  return { success: true };
}
