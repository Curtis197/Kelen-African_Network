-- ============================================================
-- Migration: Auth User Sync Trigger
-- ============================================================
-- Automates the creation of public.users and public.professionals
-- when a new user signs up via Supabase Auth (including OAuth),
-- bypassing RLS issues.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_display_name TEXT;
  v_role TEXT;
  v_country TEXT;
  v_phone TEXT;
  v_business_name TEXT;
  v_category TEXT;
  v_area_id TEXT;
  v_profession_id TEXT;
  v_city TEXT;
  v_provider TEXT;
BEGIN
  -- Determine auth provider (email, google, etc.)
  v_provider := COALESCE(NEW.provider, 'email');
  
  -- Extract display name with fallbacks for OAuth users
  -- Priority: raw_user_meta_data display_name > full_name > email prefix
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    SPLIT_PART(NEW.email, '@', 1)  -- Use email prefix as fallback
  );
  
  -- Extract role with fallback to 'client'
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  -- Extract other metadata
  v_country := NEW.raw_user_meta_data->>'country';
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_business_name := NEW.raw_user_meta_data->>'business_name';
  v_category := NEW.raw_user_meta_data->>'category';
  v_area_id := NEW.raw_user_meta_data->>'area_id';
  v_profession_id := NEW.raw_user_meta_data->>'profession_id';
  v_city := NEW.raw_user_meta_data->>'city';

  -- Log for debugging (visible in Supabase logs)
  RAISE NOTICE 'handle_new_user: provider=%, display_name=%, role=%, email=%', 
    v_provider, v_display_name, v_role, NEW.email;

  -- Insert the base user profile
  INSERT INTO public.users (id, email, display_name, role, country, phone)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_role,
    v_country,
    v_phone
  );

  -- If the user is a professional, insert the professional profile
  IF (v_role LIKE 'pro_%') THEN
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
      v_business_name,
      v_display_name,
      v_category,
      v_country,
      v_city,
      v_phone,
      NEW.email
    );
    
    RAISE NOTICE 'handle_new_user: Created professional profile for user_id=%', NEW.id;
  ELSE
    RAISE NOTICE 'handle_new_user: Created client profile for user_id=%', NEW.id;
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
