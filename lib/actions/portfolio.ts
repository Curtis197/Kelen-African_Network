"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProfessionalPortfolio } from "@/lib/supabase/types";

console.log("[portfolio] Server action loaded");

// ============================================
// Professional Portfolio Management
// ============================================

export async function getPortfolio(): Promise<ProfessionalPortfolio | null> {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] getPortfolio STARTED');
  console.log('[ACTION] ========================================');

  const supabase = await createClient();

  // Auth check
  console.log('[AUTH] Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] Auth result:', {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (authError) {
    console.error('[AUTH] ❌ Auth error:', authError);
  }

  if (!user) {
    console.warn('[AUTH] ❌ No user session - returning null');
    return null;
  }

  console.log('[AUTH] ✅ Authentication successful');

  // Fetch professional profile
  console.log('[DB] Querying professionals table...');
  console.log('[DB] Query params:', { table: 'professionals', user_id: user.id });

  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  console.log('[DB] Professional query result:', {
    success: !profError,
    hasData: !!professional,
    errorMessage: profError?.message,
    errorCode: profError?.code
  });

  if (profError) {
    if (profError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professionals table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', profError.message);
      console.error('[RLS] Fix: Check RLS policies on professionals table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Database error:', profError);
    }
    return null;
  }

  if (!professional) {
    console.warn('[DB] No professional profile found for user:', user.id);
    return null;
  }

  console.log('[DB] ✅ Professional found:', professional.id);

  // Fetch portfolio
  console.log('[DB] Querying professional_portfolio table...');
  console.log('[DB] Query params:', { table: 'professional_portfolio', professional_id: professional.id });

  const { data: portfolio, error: portfolioError } = await supabase
    .from("professional_portfolio")
    .select("*")
    .eq("professional_id", professional.id)
    .single();

  console.log('[DB] Portfolio query result:', {
    success: !portfolioError,
    hasData: !!portfolio,
    errorMessage: portfolioError?.message,
    errorCode: portfolioError?.code
  });

  if (portfolioError) {
    if (portfolioError.code === 'PGRST116') {
      // No row found — this is normal, not an error
      console.log('[DB] No portfolio found for professional (PGRST116) — user needs to create one');
    } else if (portfolioError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professional_portfolio table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Professional ID:', professional.id);
      console.error('[RLS] Error:', portfolioError.message);
      console.error('[RLS] Hint: Check if professionals.is_visible = TRUE for this user');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Database error:', {
        code: portfolioError.code,
        message: portfolioError.message,
        details: portfolioError.details,
        hint: portfolioError.hint,
      });
    }
    console.log('[ACTION] getPortfolio COMPLETED - No portfolio found');
    return null;
  }

  if (!portfolio) {
    console.warn('[DB] Query succeeded but returned 0 rows - possible silent RLS filtering');
    console.log('[ACTION] getPortfolio COMPLETED - No portfolio exists yet');
    return null;
  }

  console.log('[DB] ✅ Portfolio found:', portfolio.id);
  console.log('[ACTION] ========================================');
  console.log('[ACTION] getPortfolio COMPLETED SUCCESSFULLY');
  console.log('[ACTION] ========================================');
  return portfolio;
}

export async function createOrUpdatePortfolio(data: {
  hero_image_url: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  about_image_url: string | null;
}): Promise<ProfessionalPortfolio | null> {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] createOrUpdatePortfolio STARTED');
  console.log('[ACTION] Input:', {
    hero_image_url: data.hero_image_url ? '✓ set' : 'null',
    hero_subtitle: data.hero_subtitle,
    about_text: data.about_text ? `${data.about_text.length} chars` : 'null',
    about_image_url: data.about_image_url ? '✓ set' : 'null'
  });
  console.log('[ACTION] ========================================');

  const supabase = await createClient();

  // Auth check
  console.log('[AUTH] Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] Auth result:', {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (authError) {
    console.error('[AUTH] ❌ Auth error:', authError);
  }

  if (!user) {
    console.warn('[AUTH] ❌ Unauthorized - no user session');
    throw new Error("Non authentifié");
  }

  console.log('[AUTH] ✅ Authentication successful');

  // Fetch professional profile
  console.log('[DB] Querying professionals table...');
  console.log('[DB] Query params:', { table: 'professionals', user_id: user.id });

  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  console.log('[DB] Professional query result:', {
    success: !profError,
    hasData: !!professional,
    errorMessage: profError?.message,
    errorCode: profError?.code
  });

  if (profError) {
    if (profError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professionals table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', profError.message);
      console.error('[RLS] Fix: Check RLS policies on professionals table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Database error:', profError);
    }
    throw new Error("Profil professionnel non trouvé");
  }

  if (!professional) {
    console.warn('[DB] No professional profile found for user:', user.id);
    throw new Error("Profil professionnel non trouvé");
  }

  console.log('[DB] ✅ Professional found:', professional.id, professional.slug);

  // Check if portfolio exists
  console.log('[DB] Checking if portfolio exists...');
  console.log('[DB] Query params:', { table: 'professional_portfolio', professional_id: professional.id });

  const { data: existing, error: checkError } = await supabase
    .from("professional_portfolio")
    .select("id")
    .eq("professional_id", professional.id)
    .single();

  console.log('[DB] Portfolio check result:', {
    exists: !!existing,
    errorMessage: checkError?.message,
    errorCode: checkError?.code
  });

  if (checkError && checkError.code !== 'PGRST116') {
    if (checkError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professional_portfolio table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', checkError.message);
      console.error('[RLS] Fix: Check RLS policies on professional_portfolio table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Database error:', checkError);
    }
    throw new Error("Erreur lors de la vérification du portfolio");
  }

  let portfolio;

  if (existing) {
    // Update existing
    console.log('[DB] Updating existing portfolio:', existing.id);
    console.log('[DB] Update payload:', {
      hero_image_url: data.hero_image_url ? '✓ set' : 'null',
      about_text: data.about_text ? `${data.about_text.length} chars` : 'null'
    });

    const { data: updated, error: updateError } = await supabase
      .from("professional_portfolio")
      .update({
        hero_image_url: data.hero_image_url,
        hero_subtitle: data.hero_subtitle,
        about_text: data.about_text,
        about_image_url: data.about_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    console.log('[DB] Update result:', {
      success: !updateError,
      hasData: !!updated,
      errorMessage: updateError?.message,
      errorCode: updateError?.code
    });

    if (updateError) {
      if (updateError.code === '42501') {
        console.error('[RLS] ========================================');
        console.error('[RLS] ❌ RLS POLICY VIOLATION - UPDATE professional_portfolio');
        console.error('[RLS] ========================================');
        console.error('[RLS] Portfolio ID:', existing.id);
        console.error('[RLS] User ID:', user.id);
        console.error('[RLS] Error:', updateError.message);
        console.error('[RLS] Fix: Check UPDATE policy on professional_portfolio table');
        console.error('[RLS] ========================================');
      } else {
        console.error('[DB] ❌ Update error:', updateError);
      }
      throw new Error("Erreur lors de la mise à jour du portfolio");
    }

    portfolio = updated;
    console.log('[DB] ✅ Portfolio updated successfully');
  } else {
    // Create new
    console.log('[DB] Creating new portfolio...');
    console.log('[DB] Insert payload:', {
      professional_id: professional.id,
      hero_image_url: data.hero_image_url ? '✓ set' : 'null',
      about_text: data.about_text ? `${data.about_text.length} chars` : 'null'
    });

    const { data: created, error: insertError } = await supabase
      .from("professional_portfolio")
      .insert({
        professional_id: professional.id,
        hero_image_url: data.hero_image_url,
        hero_subtitle: data.hero_subtitle,
        about_text: data.about_text,
        about_image_url: data.about_image_url,
      })
      .select()
      .single();

    console.log('[DB] Insert result:', {
      success: !insertError,
      hasData: !!created,
      errorMessage: insertError?.message,
      errorCode: insertError?.code
    });

    if (insertError) {
      if (insertError.code === '42501') {
        console.error('[RLS] ========================================');
        console.error('[RLS] ❌ RLS POLICY VIOLATION - INSERT professional_portfolio');
        console.error('[RLS] ========================================');
        console.error('[RLS] Professional ID:', professional.id);
        console.error('[RLS] User ID:', user.id);
        console.error('[RLS] Error:', insertError.message);
        console.error('[RLS] Fix: Check INSERT policy on professional_portfolio table');
        console.error('[RLS] ========================================');
      } else {
        console.error('[DB] ❌ Insert error:', insertError);
      }
      throw new Error("Erreur lors de la création du portfolio");
    }

    portfolio = created;
    console.log('[DB] ✅ Portfolio created successfully');
  }

  console.log('[ACTION] Revalidating paths...');
  revalidatePath("/pro/portfolio");
  revalidatePath(`/professionnels/${professional.slug}`);

  console.log('[ACTION] ========================================');
  console.log('[ACTION] createOrUpdatePortfolio COMPLETED SUCCESSFULLY');
  console.log('[ACTION] Portfolio ID:', portfolio.id);
  console.log('[ACTION] ========================================');
  return portfolio;
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
  console.log('[ACTION] ========================================');
  console.log('[ACTION] createRealization STARTED');
  console.log('[ACTION] Input:', {
    professional_id: data.professional_id,
    title: data.title,
    image_count: data.image_urls.length,
    video_count: data.video_urls?.length || 0,
    document_count: data.document_files?.length || 0
  });
  console.log('[ACTION] ========================================');

  const supabase = await createClient();

  // Auth check
  console.log('[AUTH] Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] Auth result:', {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (!user) {
    console.warn('[AUTH] ❌ Unauthorized - no user session');
    throw new Error("Non authentifié");
  }

  console.log('[AUTH] ✅ Authentication successful');

  // Insert realization
  console.log('[DB] Inserting into professional_realizations...');
  console.log('[DB] Insert payload:', {
    professional_id: data.professional_id,
    title: data.title,
    location: data.location,
    price: data.price
  });

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

  console.log('[DB] Insert result:', {
    success: !insertError,
    hasData: !!realization,
    realizationId: realization?.id,
    errorMessage: insertError?.message,
    errorCode: insertError?.code
  });

  if (insertError || !realization) {
    if (insertError?.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - INSERT professional_realizations');
      console.error('[RLS] ========================================');
      console.error('[RLS] Professional ID:', data.professional_id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', insertError.message);
      console.error('[RLS] Fix: Check INSERT policy on professional_realizations table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Insert error:', insertError);
    }
    throw new Error("Erreur lors de la création de la réalisation");
  }

  console.log('[DB] ✅ Realization created:', realization.id);

  // Insert images
  if (data.image_urls.length > 0) {
    console.log('[DB] Inserting realization images...', data.image_urls.length, 'images');
    const imageRows = data.image_urls.map((url, idx) => ({
      realization_id: realization.id,
      url,
      is_main: idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("realization_images")
      .insert(imageRows);

    console.log('[DB] Images insert result:', {
      success: !imgError,
      count: data.image_urls.length,
      errorMessage: imgError?.message,
      errorCode: imgError?.code
    });

    if (imgError) {
      if (imgError.code === '42501') {
        console.error('[RLS] ========================================');
        console.error('[RLS] ❌ RLS POLICY VIOLATION - INSERT realization_images');
        console.error('[RLS] ========================================');
        console.error('[RLS] Realization ID:', realization.id);
        console.error('[RLS] User ID:', user.id);
        console.error('[RLS] Error:', imgError.message);
        console.error('[RLS] Fix: Check INSERT policy on realization_images table');
        console.error('[RLS] ========================================');
      } else {
        console.error('[DB] ❌ Image insert error:', imgError);
      }
    } else {
      console.log('[DB] ✅ Images inserted successfully');
    }
  }

  // Insert video files (optional)
  if (data.video_urls && data.video_urls.length > 0) {
    console.log('[DB] Inserting realization videos...', data.video_urls.length, 'videos');
    const videoRows = data.video_urls.map((url, idx) => ({
      realization_id: realization.id,
      url,
      order_index: idx,
    }));

    const { error: videoError } = await supabase
      .from("realization_videos")
      .insert(videoRows);

    console.log('[DB] Videos insert result:', {
      success: !videoError,
      count: data.video_urls.length,
      errorMessage: videoError?.message,
      errorCode: videoError?.code
    });

    if (videoError) {
      if (videoError.code === '42501') {
        console.error('[RLS] ========================================');
        console.error('[RLS] ❌ RLS POLICY VIOLATION - INSERT realization_videos');
        console.error('[RLS] ========================================');
        console.error('[RLS] Realization ID:', realization.id);
        console.error('[RLS] User ID:', user.id);
        console.error('[RLS] Error:', videoError.message);
        console.error('[RLS] Fix: Check INSERT policy on realization_videos table');
        console.error('[RLS] ========================================');
      } else {
        console.error('[DB] ❌ Video insert error:', videoError);
      }
    } else {
      console.log('[DB] ✅ Videos inserted successfully');
    }
  }

  // Insert document files (optional)
  if (data.document_files && data.document_files.length > 0) {
    console.log('[DB] Inserting realization documents...', data.document_files.length, 'documents');
    const docRows = data.document_files.map((f) => ({
      realization_id: realization.id,
      url: f.url,
      title: f.title,
      type: f.type,
    }));

    const { error: docError } = await supabase
      .from("realization_documents")
      .insert(docRows);

    console.log('[DB] Documents insert result:', {
      success: !docError,
      count: data.document_files.length,
      errorMessage: docError?.message,
      errorCode: docError?.code
    });

    if (docError) {
      if (docError.code === '42501') {
        console.error('[RLS] ========================================');
        console.error('[RLS] ❌ RLS POLICY VIOLATION - INSERT realization_documents');
        console.error('[RLS] ========================================');
        console.error('[RLS] Realization ID:', realization.id);
        console.error('[RLS] User ID:', user.id);
        console.error('[RLS] Error:', docError.message);
        console.error('[RLS] Fix: Check INSERT policy on realization_documents table');
        console.error('[RLS] ========================================');
      } else {
        console.error('[DB] ❌ Document insert error:', docError);
      }
    } else {
      console.log('[DB] ✅ Documents inserted successfully');
    }
  }

  console.log('[ACTION] Revalidating paths...');
  revalidatePath("/pro/portfolio");
  revalidatePath("/pro/portfolio/add");

  console.log('[ACTION] ========================================');
  console.log('[ACTION] createRealization COMPLETED SUCCESSFULLY');
  console.log('[ACTION] Realization ID:', realization.id);
  console.log('[ACTION] ========================================');
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
  console.log("[updateRealization] Updating:", id);
  console.log("[updateRealization] Data received:", {
    title: data.title,
    hasImages: !!data.image_urls?.length,
    hasVideos: !!data.video_urls?.length,
    hasUpdatedImages: !!data.updated_images?.length,
    updatedImagesCount: data.updated_images?.length || 0,
    removedImagesCount: data.removed_image_ids?.length || 0,
    removedVideosCount: data.removed_video_ids?.length || 0,
  });
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
    console.error("[updateRealization] Update error:", updateError);
    throw new Error("Erreur lors de la modification");
  }

  // Update is_main flags on existing images
  if (data.updated_images && data.updated_images.length > 0) {
    console.log("[updateRealization] Updating is_main flags on existing images...", data.updated_images.length);
    
    for (const img of data.updated_images) {
      const { error: imgUpdateError } = await supabase
        .from("realization_images")
        .update({ is_main: img.is_main })
        .eq("id", img.id);

      if (imgUpdateError) {
        console.error("[updateRealization] Error updating image is_main flag:", {
          imageId: img.id,
          is_main: img.is_main,
          error: imgUpdateError,
        });
      } else {
        console.log("[updateRealization] Updated image is_main:", { imageId: img.id, is_main: img.is_main });
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
    console.log("[updateRealization] Removing deleted videos...", data.removed_video_ids.length);
    await supabase
      .from("realization_videos")
      .delete()
      .in("id", data.removed_video_ids);
  }

  // Add new videos
  if (data.video_urls && data.video_urls.length > 0) {
    console.log("[updateRealization] Adding new videos...", data.video_urls.length);
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
      console.error("[updateRealization] Error adding videos:", videoError);
    } else {
      console.log("[updateRealization] Videos added successfully:", data.video_urls.length);
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
  console.log("[toggleRealizationFeatured] id:", id, "isFeatured:", isFeatured);
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[toggleRealizationFeatured] Auth error:", authError);
    throw new Error("Erreur d'authentification");
  }
  if (!user) throw new Error("Non authentifié");
  console.log("[toggleRealizationFeatured] user.id:", user.id);

  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profError) {
    console.error("[toggleRealizationFeatured] Professional lookup error:", profError.code, profError.message);
  }
  if (!professional) throw new Error("Profil professionnel non trouvé");
  console.log("[toggleRealizationFeatured] professional.id:", professional.id);

  const { error, data } = await supabase
    .from("professional_realizations")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .eq("professional_id", professional.id)
    .select("id, is_featured");

  console.log("[toggleRealizationFeatured] update result:", { data, error });

  if (error) {
    console.error("[toggleRealizationFeatured] ❌ Supabase error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (error.code === "42501") {
      throw new Error(`[RLS] UPDATE bloqué sur professional_realizations`);
    }
    if (error.code === "42703") {
      throw new Error(`[DB] Colonne is_featured inexistante — migration non appliquée ?`);
    }
    throw new Error(`Supabase: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.warn("[toggleRealizationFeatured] ⚠️ 0 rows updated — id or professional_id mismatch?", { id, professionalId: professional.id });
  }

  revalidatePath("/pro/realisations");
  revalidatePath("/pro/portfolio");
}

export async function deleteRealization(id: string) {
  console.log("[deleteRealization] Deleting:", id);
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
    console.error("[deleteRealization] Error:", error);
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
}): Promise<void> {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] updatePortfolioVisibility STARTED');
  console.log('[ACTION] Input:', data);
  console.log('[ACTION] ========================================');

  const supabase = await createClient();

  // Auth check
  console.log('[AUTH] Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[AUTH] Auth result:', {
    authenticated: !!user,
    userId: user?.id,
    error: authError?.message
  });

  if (authError) {
    console.error('[AUTH] ❌ Auth error:', authError);
  }

  if (!user) {
    console.warn('[AUTH] ❌ Unauthorized - no user session');
    throw new Error("Non authentifié");
  }

  console.log('[AUTH] ✅ Authentication successful');

  // Fetch professional profile
  console.log('[DB] Querying professionals table...');
  console.log('[DB] Query params:', { table: 'professionals', user_id: user.id });

  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  console.log('[DB] Professional query result:', {
    success: !profError,
    hasData: !!professional,
    errorMessage: profError?.message,
    errorCode: profError?.code
  });

  if (profError) {
    if (profError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professionals table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', profError.message);
      console.error('[RLS] Fix: Check RLS policies on professionals table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Database error:', profError);
    }
    throw new Error("Profil professionnel non trouvé");
  }

  if (!professional) {
    console.warn('[DB] No professional profile found for user:', user.id);
    throw new Error("Profil professionnel non trouvé");
  }

  console.log('[DB] ✅ Professional found:', professional.id, professional.slug);

  // Upsert portfolio visibility fields (merge with existing data via onConflict professional_id)
  console.log('[DB] Upserting professional_portfolio visibility settings...');
  console.log('[DB] Upsert payload:', {
    professional_id: professional.id,
    ...data
  });

  const { error: upsertError } = await supabase
    .from("professional_portfolio")
    .upsert(
      {
        professional_id: professional.id,
        show_realizations_section: data.show_realizations_section,
        show_services_section: data.show_services_section,
        show_products_section: data.show_products_section,
        show_about_section: data.show_about_section,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    );

  console.log('[DB] Upsert result:', {
    success: !upsertError,
    errorMessage: upsertError?.message,
    errorCode: upsertError?.code
  });

  if (upsertError) {
    if (upsertError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - UPSERT professional_portfolio');
      console.error('[RLS] ========================================');
      console.error('[RLS] Professional ID:', professional.id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', upsertError.message);
      console.error('[RLS] Fix: Check INSERT/UPDATE policy on professional_portfolio table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Upsert error:', upsertError);
    }
    throw new Error("Erreur lors de la mise à jour de la visibilité du portfolio");
  }

  console.log('[DB] ✅ Portfolio visibility updated successfully');

  console.log('[ACTION] Revalidating paths...');
  revalidatePath("/pro/site");
  revalidatePath("/pro/realisations");
  revalidatePath(`/professionnels/${professional.slug}`);

  console.log('[ACTION] ========================================');
  console.log('[ACTION] updatePortfolioVisibility COMPLETED SUCCESSFULLY');
  console.log('[ACTION] ========================================');
}
