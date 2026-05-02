"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProfessionalPortfolio } from "@/lib/supabase/types";

// ============================================
// Professional Portfolio Management
// ============================================

export async function getPortfolio(): Promise<ProfessionalPortfolio | null> {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
  }

  if (!user) {
    return null;
  }

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profError) {
    return null;
  }

  if (!professional) {
    return null;
  }

  // Fetch portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from("professional_portfolio")
    .select("*")
    .eq("professional_id", professional.id)
    .single();

  if (portfolioError) {
    return null;
  }

  if (!portfolio) {
    return null;
  }

  return portfolio;
}

export async function createOrUpdatePortfolio(data: {
  hero_image_url: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  about_image_url: string | null;
  corner_style?: string;
  color_mode?: string;
}): Promise<ProfessionalPortfolio | null> {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
  }

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (profError) {
    throw new Error("Profil professionnel non trouvé");
  }

  if (!professional) {
    throw new Error("Profil professionnel non trouvé");
  }

  // Check if portfolio exists
  const { data: existing, error: checkError } = await supabase
    .from("professional_portfolio")
    .select("id")
    .eq("professional_id", professional.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error("Erreur lors de la vérification du portfolio");
  }

  let portfolio;

  if (existing) {
    // Update existing
    const { data: updated, error: updateError } = await supabase
      .from("professional_portfolio")
      .update({
        hero_image_url: data.hero_image_url,
        hero_subtitle: data.hero_subtitle,
        about_text: data.about_text,
        about_image_url: data.about_image_url,
        ...(data.corner_style !== undefined && { corner_style: data.corner_style }),
        ...(data.color_mode !== undefined && { color_mode: data.color_mode }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      throw new Error("Erreur lors de la mise à jour du portfolio");
    }

    portfolio = updated;
  } else {
    // Create new
    const { data: created, error: insertError } = await supabase
      .from("professional_portfolio")
      .insert({
        professional_id: professional.id,
        hero_image_url: data.hero_image_url,
        hero_subtitle: data.hero_subtitle,
        about_text: data.about_text,
        about_image_url: data.about_image_url,
        ...(data.corner_style !== undefined && { corner_style: data.corner_style }),
        ...(data.color_mode !== undefined && { color_mode: data.color_mode }),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error("Erreur lors de la création du portfolio");
    }

    portfolio = created;
  }

  revalidatePath("/pro/portfolio");
  revalidatePath(`/professionnels/${professional.slug}`);

  return portfolio;
}

// ============================================
// Portfolio PDF Builder
// ============================================

export async function updatePortfolioPDF(data: {
  cover_title: string | null;
  hero_image_url: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  about_image_url: string | null;
  selected_realization_ids: string[];
  selected_service_ids: string[];
  selected_product_ids: string[];
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();
  if (!professional) throw new Error("Profil professionnel non trouvé");

  // 1. Upsert portfolio cover + about data
  const { data: existing } = await supabase
    .from("professional_portfolio")
    .select("id")
    .eq("professional_id", professional.id)
    .single();

  const portfolioPayload = {
    cover_title: data.cover_title,
    hero_image_url: data.hero_image_url,
    hero_subtitle: data.hero_subtitle,
    about_text: data.about_text,
    about_image_url: data.about_image_url,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase
      .from("professional_portfolio")
      .update(portfolioPayload)
      .eq("id", existing.id);
  } else {
    await supabase
      .from("professional_portfolio")
      .insert({ professional_id: professional.id, ...portfolioPayload });
  }

  // 2. Batch-update is_pdf_included on realizations
  await supabase
    .from("professional_realizations")
    .update({ is_pdf_included: false })
    .eq("professional_id", professional.id);

  if (data.selected_realization_ids.length > 0) {
    await supabase
      .from("professional_realizations")
      .update({ is_pdf_included: true })
      .eq("professional_id", professional.id)
      .in("id", data.selected_realization_ids);
  }

  // 3. Batch-update is_pdf_included on services
  await supabase
    .from("professional_services")
    .update({ is_pdf_included: false })
    .eq("professional_id", professional.id);

  if (data.selected_service_ids.length > 0) {
    await supabase
      .from("professional_services")
      .update({ is_pdf_included: true })
      .eq("professional_id", professional.id)
      .in("id", data.selected_service_ids);
  }

  // 4. Batch-update is_pdf_included on products
  await supabase
    .from("professional_products")
    .update({ is_pdf_included: false })
    .eq("professional_id", professional.id);

  if (data.selected_product_ids.length > 0) {
    await supabase
      .from("professional_products")
      .update({ is_pdf_included: true })
      .eq("professional_id", professional.id)
      .in("id", data.selected_product_ids);
  }

  revalidatePath("/pro/portfolio");
  revalidatePath(`/professionnels/${professional.slug}`);
}

// ============================================
// Professional Realizations
// ============================================

export async function createRealization(data: {
  professional_id: string;
  title: string;
  description: string | null;
  location: string | null;
  completion_date: string | null;
  price: number | null;
  currency: string;
  image_urls: string[];
  video_urls?: string[];
  document_files?: { url: string; title: string | null; type: string | null }[];
}) {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Insert realization
  const { data: realization, error: insertError } = await supabase
    .from("professional_realizations")
    .insert({
      professional_id: data.professional_id,
      title: data.title,
      description: data.description,
      location: data.location,
      completion_date: data.completion_date,
      price: data.price,
      currency: data.currency,
    })
    .select()
    .single();

  if (insertError || !realization) {
    throw new Error("Erreur lors de la création de la réalisation");
  }

  // Insert images
  if (data.image_urls.length > 0) {
    const imageRows = data.image_urls.map((url, idx) => ({
      realization_id: realization.id,
      url,
      is_main: idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("realization_images")
      .insert(imageRows);

    if (imgError) {
      // Non-fatal: log silently
    }
  }

  // Insert video files (optional)
  if (data.video_urls && data.video_urls.length > 0) {
    const videoRows = data.video_urls.map((url, idx) => ({
      realization_id: realization.id,
      url,
      order_index: idx,
    }));

    const { error: videoError } = await supabase
      .from("realization_videos")
      .insert(videoRows);

    if (videoError) {
      // Non-fatal
    }
  }

  // Insert document files (optional)
  if (data.document_files && data.document_files.length > 0) {
    const docRows = data.document_files.map((f) => ({
      realization_id: realization.id,
      url: f.url,
      title: f.title,
      type: f.type,
    }));

    const { error: docError } = await supabase
      .from("realization_documents")
      .insert(docRows);

    if (docError) {
      // Non-fatal
    }
  }

  revalidatePath("/pro/portfolio");
  revalidatePath("/pro/portfolio/add");

  return realization;
}

export async function updateRealization(id: string, data: {
  title: string;
  description: string | null;
  location: string | null;
  completion_date: string | null;
  price: number | null;
  currency: string;
  image_urls?: string[];
  video_urls?: string[];
  document_files?: { url: string; title: string | null; type: string | null }[];
  removed_image_ids?: string[];
  removed_video_ids?: string[];
  removed_document_ids?: string[];
  updated_images?: { id: string; url: string; is_main: boolean }[];
}) {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("professional_realizations")
    .update({
      title: data.title,
      description: data.description,
      location: data.location,
      completion_date: data.completion_date,
      price: data.price,
      currency: data.currency,
    })
    .eq("id", id);

  if (updateError) {
    throw new Error("Erreur lors de la modification");
  }

  // Update is_main flags on existing images
  if (data.updated_images && data.updated_images.length > 0) {
    for (const img of data.updated_images) {
      const { error: imgUpdateError } = await supabase
        .from("realization_images")
        .update({ is_main: img.is_main })
        .eq("id", img.id);

      if (imgUpdateError) {
        // Non-fatal
      }
    }
  }

  // Remove deleted images
  if (data.removed_image_ids && data.removed_image_ids.length > 0) {
    await supabase
      .from("realization_images")
      .delete()
      .in("id", data.removed_image_ids);
  }

  // Add new images
  if (data.image_urls && data.image_urls.length > 0) {
    const hasMain = await supabase
      .from("realization_images")
      .select("id")
      .eq("realization_id", id)
      .eq("is_main", true)
      .maybeSingle();

    const imageRows = data.image_urls.map((url, idx) => ({
      realization_id: id,
      url,
      is_main: !hasMain && idx === 0,
    }));

    await supabase.from("realization_images").insert(imageRows);
  }

  // Remove deleted videos
  if (data.removed_video_ids && data.removed_video_ids.length > 0) {
    await supabase
      .from("realization_videos")
      .delete()
      .in("id", data.removed_video_ids);
  }

  // Add new videos
  if (data.video_urls && data.video_urls.length > 0) {
    const maxOrder = await supabase
      .from("realization_videos")
      .select("order_index")
      .eq("realization_id", id)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startIndex = maxOrder?.data?.order_index !== null && maxOrder?.data?.order_index !== undefined
      ? maxOrder.data.order_index + 1
      : 0;

    const videoRows = data.video_urls.map((url, idx) => ({
      realization_id: id,
      url,
      order_index: startIndex + idx,
    }));

    const { error: videoError } = await supabase.from("realization_videos").insert(videoRows);

    if (videoError) {
      // Non-fatal
    }
  }

  // Remove deleted documents
  if (data.removed_document_ids && data.removed_document_ids.length > 0) {
    await supabase
      .from("realization_documents")
      .delete()
      .in("id", data.removed_document_ids);
  }

  // Add new documents
  if (data.document_files && data.document_files.length > 0) {
    const docRows = data.document_files.map((f) => ({
      realization_id: id,
      url: f.url,
      title: f.title,
      type: f.type,
    }));

    await supabase.from("realization_documents").insert(docRows);
  }

  revalidatePath("/pro/portfolio");
  revalidatePath(`/pro/portfolio/${id}`);
  revalidatePath(`/pro/portfolio/${id}/edit`);
}

export async function toggleRealizationFeatured(id: string, isFeatured: boolean) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new Error("Erreur d'authentification");
  }
  if (!user) throw new Error("Non authentifié");

  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) throw new Error("Profil professionnel non trouvé");

  const { error, data } = await supabase
    .from("professional_realizations")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .eq("professional_id", professional.id)
    .select("id, is_featured");

  if (error) {
    if (error.code === "42501") {
      throw new Error(`[RLS] UPDATE bloqué sur professional_realizations`);
    }
    if (error.code === "42703") {
      throw new Error(`[DB] Colonne is_featured inexistante — migration non appliquée ?`);
    }
    throw new Error(`Supabase: ${error.message}`);
  }

  revalidatePath("/pro/realisations");
  revalidatePath("/pro/portfolio");
}

export async function deleteRealization(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  // Verify ownership
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) throw new Error("Profil professionnel non trouvé");

  const { error } = await supabase
    .from("professional_realizations")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id);

  if (error) {
    throw new Error("Erreur lors de la suppression");
  }

  revalidatePath("/pro/portfolio");
}

// ============================================
// Portfolio Visibility Settings
// ============================================

export async function updatePortfolioVisibility(data: {
  show_realizations_section: boolean;
  show_services_section: boolean;
  show_products_section: boolean;
  show_about_section: boolean;
  show_calendar_section?: boolean;
}): Promise<void> {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
  }

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (profError) {
    throw new Error("Profil professionnel non trouvé");
  }

  if (!professional) {
    throw new Error("Profil professionnel non trouvé");
  }

  // Upsert portfolio visibility fields (merge with existing data via onConflict professional_id)
  const { error: upsertError } = await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: professional.id,
        show_realizations_section: data.show_realizations_section,
        show_services_section: data.show_services_section,
        show_products_section: data.show_products_section,
        show_about_section: data.show_about_section,
        ...(data.show_calendar_section !== undefined && { show_calendar_section: data.show_calendar_section }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    );

  if (upsertError) {
    throw new Error("Erreur lors de la mise à jour de la visibilité du portfolio");
  }

  revalidatePath("/pro/site");
  revalidatePath("/pro/realisations");
  revalidatePath(`/professionnels/${professional.slug}`);
}

export async function getProfessionalRealizations(
  professionalId: string,
  limit: number = 10,
  offset: number = 0
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("professional_realizations")
    .select("*, images:realization_images(*), documents:realization_documents(*)")
    .eq("professional_id", professionalId)
    .order("completion_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return [];
  }

  return data || [];
}
