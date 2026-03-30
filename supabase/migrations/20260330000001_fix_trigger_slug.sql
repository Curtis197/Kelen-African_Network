-- Fix handle_new_user trigger: generate slug + handle NOT NULL columns.
-- Root cause: professionals.slug is NOT NULL UNIQUE but was never set by the
-- trigger, causing "Database error saving new user" on every pro registration.
-- Also includes area_id and profession_id introduced in 20260329000002.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_slug  TEXT;
  final_slug TEXT;
  counter    INTEGER := 0;
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

    -- Build base slug from business_name + city (lowercase, alphanum+hyphens only)
    base_slug := lower(
      regexp_replace(
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'professionnel') || '-' ||
        COALESCE(NEW.raw_user_meta_data->>'city', 'ville'),
        '[^a-z0-9]+', '-', 'g'
      )
    );
    base_slug := trim(both '-' from base_slug);

    -- Guarantee uniqueness by appending an incrementing counter
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.professionals WHERE slug = final_slug) LOOP
      counter    := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    INSERT INTO public.professionals (
      user_id,
      business_name,
      owner_name,
      slug,
      category,
      area_id,
      profession_id,
      country,
      city,
      phone,
      email
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mon activité'),
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      final_slug,
      COALESCE(NEW.raw_user_meta_data->>'category', 'autre'),
      NULLIF(NEW.raw_user_meta_data->>'area_id', '')::uuid,
      NULLIF(NEW.raw_user_meta_data->>'profession_id', '')::uuid,
      NEW.raw_user_meta_data->>'country',
      COALESCE(NEW.raw_user_meta_data->>'city', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$;
