"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Professional Services Management
// ============================================

export async function getServices(professionalId: string, limit: number = 100, offset: number = 0) {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch services
  const { data: services, error: servicesError } = await supabase
    .from("professional_services")
    .select("*, service_images(*)")
    .eq("professional_id", professionalId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (servicesError) {
    return null;
  }

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
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profError) {
    throw new Error("Profil professionnel non trouvé");
  }

  if (!professional) {
    throw new Error("Profil professionnel non trouvé");
  }

  // Insert service
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

  if (insertError || !service) {
    throw new Error("Erreur lors de la création du service");
  }

  // Insert service images
  if (data.image_urls.length > 0) {
    const imageRows = data.image_urls.map((url, idx) => ({
      service_id: service.id,
      url,
      is_main: idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("service_images")
      .insert(imageRows);

    if (imgError) {
      // Non-fatal
    }
  }

  revalidatePath("/pro/realisations");

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
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Update service
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

  if (updateError) {
    throw new Error("Erreur lors de la modification du service");
  }

  // Remove deleted images
  if (data.removed_image_ids && data.removed_image_ids.length > 0) {
    await supabase
      .from("service_images")
      .delete()
      .in("id", data.removed_image_ids);
  }

  // Add new images
  if (data.image_urls && data.image_urls.length > 0) {
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

    if (imgError) {
      // Non-fatal
    }
  }

  revalidatePath("/pro/realisations");
}

export async function deleteService(id: string) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Non authentifié");
  }

  // Verify ownership
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    throw new Error("Profil professionnel non trouvé");
  }

  // Delete service (ownership enforced by professional_id match)
  const { error } = await supabase
    .from("professional_services")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id);

  if (error) {
    throw new Error("Erreur lors de la suppression du service");
  }

  revalidatePath("/pro/realisations");
}

export async function toggleServiceFeatured(id: string, isFeatured: boolean) {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new Error("Erreur d'authentification");
  }
  if (!user) {
    throw new Error("Non authentifié");
  }

  // Fetch professional profile
  const { data: professional, error: profError } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) throw new Error("Profil professionnel non trouvé");

  // Update is_featured, verify ownership via professional_id match
  const { error, data } = await supabase
    .from("professional_services")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .eq("professional_id", professional.id)
    .select("id, is_featured");

  if (error) {
    if (error.code === '42501') {
      throw new Error('[RLS] UPDATE bloqué sur professional_services');
    }
    if (error.code === '42703') {
      throw new Error('[DB] Colonne is_featured inexistante — migration non appliquée ?');
    }
    throw new Error(`Supabase: ${error.message}`);
  }

  revalidatePath("/pro/realisations");
}
