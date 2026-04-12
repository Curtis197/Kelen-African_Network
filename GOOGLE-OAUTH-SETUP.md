# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth for user authentication in your Kelen application.

## Overview

Google OAuth allows users to sign in with their Google account instead of creating a new email/password combination. The implementation supports both **clients** and **professionals**.

## Prerequisites

- A Google Cloud Console account
- Access to your Supabase project dashboard
- Admin access to your Kelen application

---

## Step 1: Create Google Cloud Console Credentials

### 1.1 Create a New Project (or use existing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it (e.g., "Kelen Authentication")
4. Click **Create**

### 1.2 Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Fill in required fields:
   - **App name**: Kelen
   - **User support email**: Your support email
   - **Developer contact email**: Your email
4. Click **Save and Continue**

5. **Scopes**: You don't need to add any scopes for basic authentication
   - Click **Save and Continue**

6. **Test users** (optional during development):
   - Add test users if your app is in testing mode
   - Click **Save and Continue**

### 1.3 Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Select **Web application** as application type
4. Fill in:
   - **Name**: Kelen Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://kelen.africa` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://kelen.africa/auth/callback` (for production)
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (for Supabase)

5. Click **Create**

6. **Copy your credentials**:
   - **Client ID**: Looks like `123456789-abc123.apps.googleusercontent.com`
   - **Client Secret**: A random string

---

## Step 2: Configure Supabase for Google OAuth

### 2.1 Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Toggle **Enable Sign in with Google**
6. Enter your credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console

7. **Important**: The redirect URL in Supabase should be:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

8. Click **Save**

### 2.2 Add Redirect URLs in Supabase

1. Navigate to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (development)
   - `https://kelen.africa/auth/callback` (production)

3. Click **Save**

---

## Step 3: Update Environment Variables

### 3.1 Local Development

Update your `.env.local` file:

```env
# Google OAuth (for user authentication)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 3.2 Production (Vercel)

Add these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add:
   - `GOOGLE_CLIENT_ID` = your Google Client ID
   - `GOOGLE_CLIENT_SECRET` = your Google Client Secret

---

## Step 4: Run Database Migration

The migration file `20260412000007_google_oauth_support.sql` updates the auth trigger to properly handle Google OAuth signups.

### Run the migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase SQL Editor
```

This migration:
- Improves display name extraction from Google OAuth data
- Adds fallbacks for missing metadata
- Logs auth provider for debugging

---

## Step 5: Test the Integration

### 5.1 Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   - **Login**: `http://localhost:3000/connexion` or `http://localhost:3000/pro/connexion`
   - **Registration**: `http://localhost:3000/inscription` or `http://localhost:3000/pro/inscription`

3. You should see a **"Continuer avec Google"** button above the email/password form on all pages

4. Click the button and:
   - Select your Google account
   - Grant permissions
   - You should be redirected to the appropriate dashboard

### 5.2 Verify User Creation

After signing in with Google:

1. Check your Supabase dashboard → **Authentication** → **Users**
   - You should see the new user with provider = `google`

2. Check the `users` table:
   ```sql
   SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
   ```

3. If the user is a professional, check the `professionals` table:
   ```sql
   SELECT * FROM professionals ORDER BY created_at DESC LIMIT 1;
   ```

---

## How It Works

### Authentication Flow

1. **User clicks "Continuer avec Google"**
   - The `GoogleButton` component calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
   - User is redirected to Google's consent screen

2. **Google OAuth Callback**
   - Google redirects to Supabase's auth endpoint
   - Supabase exchanges the authorization code for a session
   - Supabase redirects to `/auth/callback` in your app

3. **Profile Sync (Automatic)**
   - The `/auth/callback` route handler detects this is a Google OAuth login
   - Extracts Google profile metadata: `avatar_url`, `full_name`, `email_verified`
   - Updates the `users` table with:
     - `profile_picture_url` = Google avatar URL
     - `display_name` = Google full name (if different from current)
   - If user is a professional, also updates `professionals.profile_picture_url`
   - All operations are logged with comprehensive instrumentation

4. **Session Exchange & Role Detection**
   - Queries the `users` table to get the user's role
   - Redirects to the appropriate dashboard:
     - `client` → `/dashboard`
     - `pro_*` → `/pro/dashboard`
     - `admin` → `/admin`

5. **First-Time Signup (via OAuth)**
   - When a Google user signs up for the first time, the `handle_new_user()` trigger fires
   - Creates a record in `public.users` with:
     - `id` = Supabase auth user ID
     - `email` = Google email
     - `display_name` = Extracted from Google profile
     - `profile_picture_url` = Google avatar URL
     - `role` = `client` (default)
   - If role metadata is set to `pro_*`, also creates `public.professionals` record

### Google Profile Data Extraction

Google OAuth provides the following metadata that is automatically synced:

| Google Field | Mapped To | Description |
|--------------|-----------|-------------|
| `avatar_url` | `users.profile_picture_url` | Google profile photo URL |
| `picture` | `users.profile_picture_url` | Alternative photo URL (fallback) |
| `photo_link` | `users.profile_picture_url` | Another alternative (fallback) |
| `full_name` | `users.display_name` | User's full name from Google |
| `name` | `users.display_name` | Alternative name (fallback) |
| `email_verified` | (logged only) | Whether Google verified the email |

### Profile Sync for Returning Users

When a returning Google OAuth user logs in:
1. The callback handler checks if their avatar or name has changed
2. Only updates if the Google profile data differs from the database
3. Logs all changes with before/after values
4. Handles RLS violations gracefully with explicit error logging

### Role Assignment for Google Users

By default, Google OAuth users are assigned the `client` role. To make a Google user a professional:

1. **Option 1**: Manually update the role after signup:
   ```sql
   UPDATE users SET role = 'pro_africa' WHERE email = 'user@example.com';
   ```

2. **Option 2**: Implement a role selection UI before OAuth redirect (future enhancement)

---

## Troubleshooting

### Issue: "Invalid redirect_uri" Error

**Solution**: Ensure the redirect URI in Google Cloud Console exactly matches:
- `http://localhost:3000/auth/callback` (development)
- `https://kelen.africa/auth/callback` (production)

### Issue: User not created in `users` table

**Solution**: Check Supabase logs for trigger errors:
1. Go to Supabase Dashboard → **Database** → **Logs**
2. Filter by `handle_new_user` function
3. Look for error messages

### Issue: "Missing Google OAuth credentials"

**Solution**: Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in:
- `.env.local` (development)
- Vercel environment variables (production)

### Issue: RLS violation on user query

**Solution**: Check that the user can query their own profile:
```sql
-- Test RLS policy
SELECT * FROM users WHERE id = auth.uid();
```

If this returns 0 rows, check your RLS policies in `supabase/RLS-list.md`.

---

## Security Considerations

1. **Never commit `.env.local` to version control**
   - Already in `.gitignore`
   - Use Vercel environment variables for production

2. **Restrict OAuth scopes**
   - Currently only requests basic profile access
   - No sensitive scopes like email sending

3. **Enable email verification in Supabase** (optional)
   - Google users are pre-verified by Google
   - Email/password users should verify their email

4. **Monitor auth logs**
   - Check Supabase logs for unusual activity
   - Set up alerts for failed login attempts

---

## Future Enhancements

1. **Role selection during OAuth signup**
   - Add a modal asking "Client or Professional?" before completing signup

2. **Professional onboarding flow**
   - After first Google login, redirect to professional setup form
   - Collect: business name, category, city, area, profession

3. **Account linking**
   - Allow users to link Google to existing email/password account
   - Prevent duplicate accounts

4. **Multi-provider support**
   - Add Facebook, Apple, GitHub OAuth using the same pattern

---

## Files Modified

| File | Purpose |
|------|---------|
| `components/auth/GoogleButton.tsx` | Google OAuth button component |
| `components/forms/LoginForm.tsx` | Added Google button to login form |
| `app/(auth)/connexion/page.tsx` | Client login page (Google button via LoginForm) |
| `app/(auth)/pro/connexion/page.tsx` | Professional login page (Google button via LoginForm) |
| `app/(auth)/inscription/page.tsx` | Client registration page with Google button |
| `app/(auth)/pro/inscription/page.tsx` | Professional registration page with Google button |
| `app/auth/callback/route.ts` | Enhanced callback with Google profile sync |
| `lib/actions/google-profile.ts` | Server action for profile sync (backup method) |
| `supabase/migrations/20260412000007_google_oauth_support.sql` | Updated auth trigger with avatar extraction |
| `supabase/migrations/20260412000008_add_user_profile_picture.sql` | Added profile_picture_url to users table |
| `.env.example` | Added Google OAuth env vars |
| `.env.local` | Added placeholder Google credentials |

---

## Support

If you encounter issues:
1. Check the console logs (browser and server)
2. Review Supabase auth logs
3. Verify environment variables are set correctly
4. Test with a fresh Google account

All auth-related code includes comprehensive logging with `[Google OAuth]`, `[Auth Callback]`, and `[ACTION]` prefixes for easy debugging.
