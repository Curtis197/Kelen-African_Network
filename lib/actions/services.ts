"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

console.log("[services] Server action loaded");

// ============================================
// Professional Services Management
// ============================================

export async function getServices(professionalId: string) {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] getServices STARTED');
  console.log('[ACTION] Input:', { professionalId });
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

  // Fetch services
  console.log('[DB] Querying professional_services table...');
  console.log('[DB] Query params:', { table: 'professional_services', professional_id: professionalId });

  const { data: services, error: servicesError } = await supabase
    .from("professional_services")
    .select("*, service_images(*)")
    .eq("professional_id", professionalId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  console.log('[DB] Services query result:', {
    success: !servicesError,
    count: services?.length ?? 0,
    errorMessage: servicesError?.message,
    errorCode: servicesError?.code
  });

  if (servicesError) {
    if (servicesError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - professional_services table');
      console.error('[RLS] ========================================');
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Professional ID:', professionalId);
      console.error('[RLS] Error:', servicesError.message);
      console.error('[RLS] Fix: Check RLS policies on professional_services table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Database error:', {
        code: servicesError.code,
        message: servicesError.message,
        details: servicesError.details,
        hint: servicesError.hint,
      });
    }
    console.log('[ACTION] getServices COMPLETED - Error fetching services');
    return null;
  }

  console.log('[DB] ✅ Services fetched:', services?.length ?? 0, 'records');
  console.log('[ACTION] ========================================');
  console.log('[ACTION] getServices COMPLETED SUCCESSFULLY');
  console.log('[ACTION] ========================================');
  return services;
}

export async function createService(data: {
  professional_id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  duration: string | null;
  category: string | null;
  image_urls: string[];
}) {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] createService STARTED');
  console.log('[ACTION] Input:', {
    professional_id: data.professional_id,
    title: data.title,
    price: data.price,
    currency: data.currency,
    image_count: data.image_urls.length
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
    throw new Error("Profil professionnel non trouvé");
  }

  if (!professional) {
    console.warn('[DB] No professional profile found for user:', user.id);
    throw new Error("Profil professionnel non trouvé");
  }

  console.log('[DB] ✅ Professional found:', professional.id);

  // Insert service
  console.log('[DB] Inserting into professional_services...');
  console.log('[DB] Insert payload:', {
    professional_id: data.professional_id,
    title: data.title,
    price: data.price,
    currency: data.currency
  });

  const { data: service, error: insertError } = await supabase
    .from("professional_services")
    .insert({
      professional_id: data.professional_id,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      duration: data.duration,
      category: data.category,
    })
    .select()
    .single();

  console.log('[DB] Insert result:', {
    success: !insertError,
    hasData: !!service,
    serviceId: service?.id,
    errorMessage: insertError?.message,
    errorCode: insertError?.code
  });

  if (insertError || !service) {
    if (insertError?.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - INSERT professional_services');
      console.error('[RLS] ========================================');
      console.error('[RLS] Professional ID:', data.professional_id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', insertError.message);
      console.error('[RLS] Fix: Check INSERT policy on professional_services table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Insert error:', insertError);
    }
    throw new Error("Erreur lors de la création du service");
  }

  console.log('[DB] ✅ Service created:', service.id);

  // Insert service images
  if (data.image_urls.length > 0) {
    console.log('[DB] Inserting service images...', data.image_urls.length, 'images');
    const imageRows = data.image_urls.map((url, idx) => ({
      service_id: service.id,
      url,
      is_main: idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("service_images")
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
        console.error('[RLS] ❌ RLS POLICY VIOLATION - INSERT service_images');
        console.error('[RLS] ========================================');
        console.error('[RLS] Service ID:', service.id);
        console.error('[RLS] User ID:', user.id);
        console.error('[RLS] Error:', imgError.message);
        console.error('[RLS] Fix: Check INSERT policy on service_images table');
        console.error('[RLS] ========================================');
      } else {
        console.error('[DB] ❌ Image insert error:', imgError);
      }
    } else {
      console.log('[DB] ✅ Images inserted successfully');
    }
  }

  console.log('[ACTION] Revalidating paths...');
  revalidatePath("/pro/realisations");

  console.log('[ACTION] ========================================');
  console.log('[ACTION] createService COMPLETED SUCCESSFULLY');
  console.log('[ACTION] Service ID:', service.id);
  console.log('[ACTION] ========================================');
  return service;
}

export async function updateService(id: string, data: {
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  duration: string | null;
  category: string | null;
  image_urls?: string[];
  removed_image_ids?: string[];
}) {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] updateService STARTED');
  console.log('[ACTION] Input:', {
    id,
    title: data.title,
    hasNewImages: !!data.image_urls?.length,
    newImageCount: data.image_urls?.length || 0,
    removedImageCount: data.removed_image_ids?.length || 0
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

  // Update service
  console.log('[DB] Updating professional_services...');
  const { error: updateError } = await supabase
    .from("professional_services")
    .update({
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      duration: data.duration,
      category: data.category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  console.log('[DB] Update result:', {
    success: !updateError,
    errorMessage: updateError?.message,
    errorCode: updateError?.code
  });

  if (updateError) {
    if (updateError.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - UPDATE professional_services');
      console.error('[RLS] ========================================');
      console.error('[RLS] Service ID:', id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', updateError.message);
      console.error('[RLS] Fix: Check UPDATE policy on professional_services table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Update error:', updateError);
    }
    throw new Error("Erreur lors de la modification du service");
  }

  console.log('[DB] ✅ Service updated successfully');

  // Remove deleted images
  if (data.removed_image_ids && data.removed_image_ids.length > 0) {
    console.log('[DB] Removing deleted images...', data.removed_image_ids.length);
    await supabase
      .from("service_images")
      .delete()
      .in("id", data.removed_image_ids);
  }

  // Add new images
  if (data.image_urls && data.image_urls.length > 0) {
    console.log('[DB] Adding new images...', data.image_urls.length);
    const hasMain = await supabase
      .from("service_images")
      .select("id")
      .eq("service_id", id)
      .eq("is_main", true)
      .maybeSingle();

    const imageRows = data.image_urls.map((url, idx) => ({
      service_id: id,
      url,
      is_main: !hasMain.data && idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("service_images")
      .insert(imageRows);

    console.log('[DB] New images insert result:', {
      success: !imgError,
      count: data.image_urls.length,
      errorMessage: imgError?.message,
      errorCode: imgError?.code
    });

    if (imgError) {
      console.error('[DB] ❌ Image insert error:', imgError);
    } else {
      console.log('[DB] ✅ New images inserted successfully');
    }
  }

  console.log('[ACTION] Revalidating paths...');
  revalidatePath("/pro/realisations");

  console.log('[ACTION] ========================================');
  console.log('[ACTION] updateService COMPLETED SUCCESSFULLY');
  console.log('[ACTION] ========================================');
}

export async function deleteService(id: string) {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] deleteService STARTED');
  console.log('[ACTION] Input:', { id });
  console.log('[ACTION] ========================================');

  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[AUTH] ❌ Unauthorized - no user session');
    throw new Error("Non authentifié");
  }

  console.log('[AUTH] ✅ Authentication successful');

  // Verify ownership
  console.log('[DB] Verifying ownership via professionals table...');
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    console.warn('[DB] No professional profile found for user:', user.id);
    throw new Error("Profil professionnel non trouvé");
  }

  console.log('[DB] ✅ Professional found:', professional.id);

  // Delete service (ownership enforced by professional_id match)
  console.log('[DB] Deleting from professional_services...');
  const { error } = await supabase
    .from("professional_services")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id);

  console.log('[DB] Delete result:', {
    success: !error,
    errorMessage: error?.message,
    errorCode: error?.code
  });

  if (error) {
    if (error.code === '42501') {
      console.error('[RLS] ========================================');
      console.error('[RLS] ❌ RLS POLICY VIOLATION - DELETE professional_services');
      console.error('[RLS] ========================================');
      console.error('[RLS] Service ID:', id);
      console.error('[RLS] User ID:', user.id);
      console.error('[RLS] Error:', error.message);
      console.error('[RLS] Fix: Check DELETE policy on professional_services table');
      console.error('[RLS] ========================================');
    } else {
      console.error('[DB] ❌ Delete error:', error);
    }
    throw new Error("Erreur lors de la suppression du service");
  }

  console.log('[DB] ✅ Service deleted successfully');

  console.log('[ACTION] Revalidating paths...');
  revalidatePath("/pro/realisations");

  console.log('[ACTION] ========================================');
  console.log('[ACTION] deleteService COMPLETED SUCCESSFULLY');
  console.log('[ACTION] ========================================');
}

export async function toggleServiceFeatured(id: string, isFeatured: boolean) {
  console.log('[ACTION] ========================================');
  console.log('[ACTION] toggleServiceFeatured STARTED');
  console.log('[ACTION] Input:', { id, isFeatured });
  console.log('[ACTION] ========================================');

  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[AUTH] ❌ Auth error:', authError);
    throw new Error("Erreur d'authentification");
  }
  if (!user) {
    console.warn('[AUTH] ❌ Unauthorized - no user session');
    throw new Error("Non authentifié");
  }

  console.log('[AUTH] ✅ Authentication successful, user.id:', user.id);

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profError) {
    console.error('[DB] Professional lookup error:', profError.code, profError.message);
  }
  if (!professional) throw new Error("Profil professionnel non trouvé");

  console.log('[DB] ✅ Professional found:', professional.id);

  // Update is_featured, verify ownership via professional_id match
  const { error, data } = await supabase
    .from("professional_services")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .eq("professional_id", professional.id)
    .select("id, is_featured");

  console.log('[DB] toggleServiceFeatured update result:', { data, error });

  if (error) {
    console.error('[DB] ❌ Supabase error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    if (error.code === '42501') {
      throw new Error('[RLS] UPDATE bloqué sur professional_services');
    }
    if (error.code === '42703') {
      throw new Error('[DB] Colonne is_featured inexistante — migration non appliquée ?');
    }
    throw new Error(`Supabase: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.warn('[DB] ⚠️ 0 rows updated — id or professional_id mismatch?', { id, professionalId: professional.id });
  }

  console.log('[ACTION] Revalidating paths...');
  revalidatePath("/pro/realisations");

  console.log('[ACTION] ========================================');
  console.log('[ACTION] toggleServiceFeatured COMPLETED SUCCESSFULLY');
  console.log('[ACTION] ========================================');
}
