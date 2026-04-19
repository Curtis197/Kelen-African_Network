// lib/actions/portfolio-site.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePortfolioCopy } from "@/lib/portfolio/copy-generator";
import type { StyleAnswers } from "@/lib/portfolio/style-tokens";
import type { CopyAnswers } from "@/lib/portfolio/copy-generator";
import { revalidatePath } from "next/cache";

async function getProfessional() {
  console.log('[ACTION] getProfessional: start');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  console.log('[AUTH] getProfessional: user found', { userId: user.id });

  const { data: pro, error } = await supabase
    .from("professionals")
    .select("id, slug, business_name, category, city, country, years_of_experience")
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

export async function saveStyleQuiz(answers: StyleAnswers) {
  console.log('[ACTION] saveStyleQuiz: start', { answers });
  const { supabase, pro } = await getProfessional();

  const { data, error } = await supabase
    .from("professional_portfolio")
    .upsert(
      { professional_id: pro.id, style_tokens: answers, updated_at: new Date().toISOString() },
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
    yearsOfExperience: pro.years_of_experience,
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
