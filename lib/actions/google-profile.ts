"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Sync Google profile information to database after OAuth login
 * This handles:
 * 1. Fetching user's current session and metadata from Supabase Auth
 * 2. Extracting Google profile info (avatar, name, etc.)
 * 3. Updating the users/professionals table with the profile data
 */
export async function syncGoogleProfile() {
  const supabase = await createClient();

  try {
    // 1. Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return { success: false, error: "No active session" };
    }

    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    // 2. Check if user is from Google
    const provider = session.user.app_metadata?.provider;
    if (provider !== "google") {
      return { success: false, error: "Not a Google OAuth user" };
    }

    // 3. Extract Google profile metadata
    const metadata = session.user.user_metadata || {};
    const avatarUrl = metadata.avatar_url || metadata.picture || metadata.photo_link;
    const fullName = metadata.full_name || metadata.name || metadata.display_name;
    const emailVerified = metadata.email_verified;

    if (!avatarUrl && !fullName) {
      return { success: true, synced: false, reason: "No new data" };
    }

    // 4. Get current user role to determine which table to update
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, profile_picture_url, display_name")
      .eq("id", session.user.id)
      .single();

    if (userError?.code === "42501") {
      return { success: false, error: "RLS violation on users table" };
    }

    const role = userData?.role || "client";
    const isProfessional = role.startsWith("pro_");

    // 5. Prepare update data
    const updateData: any = {};

    // Only update if we have new data
    if (avatarUrl && avatarUrl !== userData?.profile_picture_url) {
      updateData.profile_picture_url = avatarUrl;
    }

    if (fullName && fullName !== userData?.display_name) {
      updateData.display_name = fullName;
    }

    // 6. Update the appropriate table
    if (Object.keys(updateData).length === 0) {
      return { success: true, synced: false, reason: "Already synced" };
    }

    let updateResult;
    let updateError;

    if (isProfessional) {
      // Update professionals table
      // For professionals, also update profile_picture_url in professionals table
      if (updateData.profile_picture_url) {
        ({ data: updateResult, error: updateError } = await supabase
          .from("professionals")
          .update({ profile_picture_url: updateData.profile_picture_url })
          .eq("user_id", session.user.id)
          .select()
          .single());
      }
    }

    // Always update users table (for both clients and professionals)
    ({ data: updateResult, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", session.user.id)
      .select()
      .single());

    if (updateError?.code === "42501") {
      return { success: false, error: "RLS violation on users update" };
    }

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      synced: true,
      updatedFields: Object.keys(updateData),
      data: updateResult,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error during profile sync" };
  }
}
