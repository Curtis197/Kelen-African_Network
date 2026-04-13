"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProfileFormData {
  displayName: string;
  country: string;
  phone: string;
  emailNotifications: boolean;
  language: string;
}

export async function getUserProfile(): Promise<{ success: boolean; data?: ProfileFormData; error?: string }> {
  console.log('[PROFILE] Fetching user profile');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  console.log('[PROFILE] Auth user:', user?.id);
  if (!user) return { success: false, error: "Non authentifié" };

  const { data, error } = await supabase
    .from("users")
    .select("display_name, country, phone, email_notifications, language")
    .eq("id", user.id)
    .single();

  console.log('[PROFILE] Result:', { data, error: error?.message, code: error?.code });

  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on users!');
    console.error('[RLS] Table: users');
    console.error('[RLS] User ID:', user.id);
    console.error('[RLS] Fix: Add RLS policy allowing SELECT for users WHERE id = auth.uid()');
  }

  if (error) {
    console.error("Error fetching profile:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      displayName: data.display_name,
      country: data.country,
      phone: data.phone || "",
      emailNotifications: data.email_notifications ?? true,
      language: data.language || "fr",
    },
  };
}

export async function updateUserProfile(formData: ProfileFormData): Promise<{ success: boolean; error?: string }> {
  console.log('[PROFILE] Updating profile:', formData);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  console.log('[PROFILE] Auth user:', user?.id);
  if (!user) return { success: false, error: "Non authentifié" };

  if (!formData.displayName.trim()) {
    return { success: false, error: "Le nom est requis" };
  }

  if (!formData.country.trim()) {
    return { success: false, error: "Le pays est requis" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      display_name: formData.displayName.trim(),
      country: formData.country.trim(),
      phone: formData.phone.trim() || null,
      email_notifications: formData.emailNotifications,
      language: formData.language,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  console.log('[PROFILE] Update result:', { error: error?.message, code: error?.code });

  if (error?.code === '42501') {
    console.error('[RLS] ❌ EXPLICIT RLS BLOCKING on users UPDATE!');
    console.error('[RLS] Table: users');
    console.error('[RLS] User ID:', user.id);
    console.error('[RLS] Fix: Add RLS policy allowing UPDATE for users WHERE id = auth.uid()');
  }

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  console.log('[PROFILE] Profile updated successfully');
  revalidatePath("/parametres/profil");
  return { success: true };
}
