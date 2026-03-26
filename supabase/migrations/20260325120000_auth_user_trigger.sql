-- ============================================================
-- Migration: Auth User Sync Trigger
-- ============================================================
-- Automates the creation of public.users and public.professionals
-- when a new user signs up via Supabase Auth, bypassing RLS issues.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the base user profile
  INSERT INTO public.users (id, email, display_name, role, country, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'phone'
  );

  -- If the user is a professional, insert the professional profile
  IF (NEW.raw_user_meta_data->>'role' LIKE 'pro_%') THEN
    INSERT INTO public.professionals (
      user_id,
      business_name,
      owner_name,
      category,
      country,
      city,
      phone,
      email
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'business_name',
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NEW.raw_user_meta_data->>'category',
      NEW.raw_user_meta_data->>'country',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'phone',
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists (idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
