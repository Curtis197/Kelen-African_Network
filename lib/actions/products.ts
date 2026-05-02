"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Professional Products Management
// ============================================

export async function getProducts(professionalId: string, limit: number = 100, offset: number = 0) {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from("professional_products")
    .select("*, product_images(*)")
    .eq("professional_id", professionalId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (productsError) {
    return null;
  }

  return products;
}

export async function createProduct(data: {
  professional_id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  availability: 'available' | 'limited' | 'out_of_stock';
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

  // Insert product
  const { data: product, error: insertError } = await supabase
    .from("professional_products")
    .insert({
      professional_id: data.professional_id,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      availability: data.availability,
      category: data.category,
    })
    .select()
    .single();

  if (insertError || !product) {
    throw new Error("Erreur lors de la création du produit");
  }

  // Insert product images
  if (data.image_urls.length > 0) {
    const imageRows = data.image_urls.map((url, idx) => ({
      product_id: product.id,
      url,
      is_main: idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("product_images")
      .insert(imageRows);

    if (imgError) {
      // Non-fatal
    }
  }

  revalidatePath("/pro/realisations");

  return product;
}

export async function updateProduct(id: string, data: {
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  availability: 'available' | 'limited' | 'out_of_stock';
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

  // Update product
  const { error: updateError } = await supabase
    .from("professional_products")
    .update({
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      availability: data.availability,
      category: data.category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    throw new Error("Erreur lors de la modification du produit");
  }

  // Remove deleted images
  if (data.removed_image_ids && data.removed_image_ids.length > 0) {
    await supabase
      .from("product_images")
      .delete()
      .in("id", data.removed_image_ids);
  }

  // Add new images
  if (data.image_urls && data.image_urls.length > 0) {
    const hasMain = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", id)
      .eq("is_main", true)
      .maybeSingle();

    const imageRows = data.image_urls.map((url, idx) => ({
      product_id: id,
      url,
      is_main: !hasMain.data && idx === 0,
    }));

    const { error: imgError } = await supabase
      .from("product_images")
      .insert(imageRows);

    if (imgError) {
      // Non-fatal
    }
  }

  revalidatePath("/pro/realisations");
}

export async function deleteProduct(id: string) {
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

  // Delete product (ownership enforced by professional_id match)
  const { error } = await supabase
    .from("professional_products")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id);

  if (error) {
    throw new Error("Erreur lors de la suppression du produit");
  }

  revalidatePath("/pro/realisations");
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
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
    .from("professional_products")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .eq("professional_id", professional.id)
    .select("id, is_featured");

  if (error) {
    if (error.code === '42501') {
      throw new Error('[RLS] UPDATE bloqué sur professional_products');
    }
    if (error.code === '42703') {
      throw new Error('[DB] Colonne is_featured inexistante — migration non appliquée ?');
    }
    throw new Error(`Supabase: ${error.message}`);
  }

  revalidatePath("/pro/realisations");
}
