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
  console.log("[Google Profile Sync] Starting profile sync");

  const supabase = await createClient();

  try {
    // 1. Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[Google Profile Sync] ERROR: Failed to get session", {
        error: sessionError.message,
        code: sessionError.code,
      });
      return { success: false, error: "No active session" };
    }

    if (!session) {
      console.warn("[Google Profile Sync] No session found");
      return { success: false, error: "Not authenticated" };
    }

    console.log("[Google Profile Sync] Session found", {
      userId: session.user.id,
      email: session.user.email,
      provider: session.user.app_metadata?.provider,
      hasAvatar: !!session.user.user_metadata?.avatar_url,
    });

    // 2. Check if user is from Google
    const provider = session.user.app_metadata?.provider;
    if (provider !== "google") {
      console.log("[Google Profile Sync] User not from Google provider, skipping sync", { provider });
      return { success: false, error: "Not a Google OAuth user" };
    }

    // 3. Extract Google profile metadata
    const metadata = session.user.user_metadata || {};
    const avatarUrl = metadata.avatar_url || metadata.picture || metadata.photo_link;
    const fullName = metadata.full_name || metadata.name || metadata.display_name;
    const emailVerified = metadata.email_verified;

    console.log("[Google Profile Sync] Extracted Google metadata", {
      hasAvatar: !!avatarUrl,
      avatarUrl: avatarUrl ? `${avatarUrl.substring(0, 50)}...` : null,
      fullName,
      emailVerified,
    });

    if (!avatarUrl && !fullName) {
      console.log("[Google Profile Sync] No new profile data to sync from Google");
      return { success: true, synced: false, reason: "No new data" };
    }

    // 4. Get current user role to determine which table to update
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, profile_picture_url, display_name")
      .eq("id", session.user.id)
      .single();

    console.log("[Google Profile Sync] Current user data from DB", {
      role: userData?.role,
      currentAvatar: userData?.profile_picture_url,
      currentName: userData?.display_name,
      error: userError?.message,
      rlsCode: userError?.code,
    });

    if (userError?.code === "42501") {
      console.error("[Google Profile Sync] ❌ EXPLICIT RLS BLOCKING on users select!");
      console.error("[Google Profile Sync] Table: users, User: ", session.user.id);
      console.error("[Google Profile Sync] Fix: Check RLS policy 'users_select_own' allows select where id = auth.uid()");
      return { success: false, error: "RLS violation on users table" };
    }

    if (!userData) {
      console.warn("[Google Profile Sync] ⚠️ SILENT RLS FILTERING on users table!");
      console.warn("[Google Profile Sync] Query succeeded but returned 0 rows - user may not have profile yet");
      // This can happen if the trigger hasn't run yet, so we'll try to update anyway
    }

    const role = userData?.role || "client";
    const isProfessional = role.startsWith("pro_");

    // 5. Prepare update data
    const updateData: any = {};

    // Only update if we have new data
    if (avatarUrl && avatarUrl !== userData?.profile_picture_url) {
      updateData.profile_picture_url = avatarUrl;
      console.log("[Google Profile Sync] Will update profile_picture_url");
    }

    if (fullName && fullName !== userData?.display_name) {
      updateData.display_name = fullName;
      console.log("[Google Profile Sync] Will update display_name");
    }

    // 6. Update the appropriate table
    if (Object.keys(updateData).length === 0) {
      console.log("[Google Profile Sync] No updates needed - profile already in sync");
      return { success: true, synced: false, reason: "Already synced" };
    }

    let updateResult;
    let updateError;

    if (isProfessional) {
      // Update professionals table
      console.log("[Google Profile Sync] Updating professionals table", { userId: session.user.id });

      // For professionals, also update profile_picture_url in professionals table
      if (updateData.profile_picture_url) {
        ({ data: updateResult, error: updateError } = await supabase
          .from("professionals")
          .update({ profile_picture_url: updateData.profile_picture_url })
          .eq("user_id", session.user.id)
          .select()
          .single());

        if (updateError?.code === "42501") {
          console.error("[Google Profile Sync] ❌ EXPLICIT RLS BLOCKING on professionals update!");
          console.error("[Google Profile Sync] Table: professionals, User: ", session.user.id);
          console.error("[Google Profile Sync] Fix: Check RLS policy allows update where user_id = auth.uid()");
        }
        if (!updateError && !updateResult) {
          console.warn("[Google Profile Sync] ⚠️ SILENT RLS FILTERING on professionals update!");
        }

        console.log("[Google Profile Sync] Professionals update result", {
          success: !!updateResult,
          error: updateError?.message,
        });
      }
    }

    // Always update users table (for both clients and professionals)
    console.log("[Google Profile Sync] Updating users table", { userId: session.user.id, data: updateData });

    ({ data: updateResult, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", session.user.id)
      .select()
      .single());

    if (updateError?.code === "42501") {
      console.error("[Google Profile Sync] ❌ EXPLICIT RLS BLOCKING on users update!");
      console.error("[Google Profile Sync] Table: users, User: ", session.user.id);
      console.error("[Google Profile Sync] Fix: Check RLS policy 'users_update_own' allows update where id = auth.uid()");
      return { success: false, error: "RLS violation on users update" };
    }
    if (!updateError && !updateResult) {
      console.warn("[Google Profile Sync] ⚠️ SILENT RLS FILTERING on users update!");
    }

    console.log("[Google Profile Sync] Users update result", {
      success: !!updateResult,
      error: updateError?.message,
      updatedFields: Object.keys(updateData),
    });

    if (updateError) {
      console.error("[Google Profile Sync] ERROR during update", {
        error: updateError.message,
        code: updateError.code,
        details: updateError.details,
      });
      return { success: false, error: updateError.message };
    }

    console.log("[Google Profile Sync] ✅ Profile sync completed successfully");
    return {
      success: true,
      synced: true,
      updatedFields: Object.keys(updateData),
      data: updateResult,
    };
  } catch (err: any) {
    console.error("[Google Profile Sync] ❌ UNEXPECTED ERROR", err);
    return { success: false, error: err.message || "Unknown error during profile sync" };
  }
}
