-- Fix slug generation: uppercase letters were being dropped.
-- Root cause: lower() was applied AFTER regexp_replace('[^a-z0-9]+', …),
-- so capital letters (K, P, A …) matched [^a-z0-9] and were replaced by
-- hyphens, then trimmed away.  Fix: lowercase the string first, then strip
-- non-alphanum chars.

-- ── 1. Fix generate_professional_slug() ────────────────────────────────────
-- Called BEFORE INSERT on professionals (trigger generate_slug_before_insert).

CREATE OR REPLACE FUNCTION generate_professional_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter   INTEGER := 1;
BEGIN
  -- Slugify: lowercase first, then replace accented chars, then collapse
  -- non-alphanum to hyphens.  lower() must wrap translate() so that
  -- regexp_replace sees only lowercase a-z letters.
  base_slug := trim(both '-' FROM
    regexp_replace(
      lower(
        translate(
          NEW.business_name || '-' || NEW.city,
          'àáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞ',
          'aaaaaaeceeeeiiiidnoooooouuuuytya aaaaaaeceeeeiiiidnoooooouuuuyty'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );

  candidate := base_slug;

  -- Check uniqueness, append counter if needed
  WHILE EXISTS (
    SELECT 1 FROM professionals
    WHERE slug = candidate AND id != COALESCE(NEW.id, gen_random_uuid())
  ) LOOP
    candidate := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Fix handle_new_user() ────────────────────────────────────────────────
-- Called AFTER INSERT on auth.users (trigger on_auth_user_created).

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

    -- Build slug: lowercase first, then strip non-alphanum.
    base_slug := trim(both '-' FROM
      regexp_replace(
        lower(
          COALESCE(NEW.raw_user_meta_data->>'business_name', 'professionnel') || '-' ||
          COALESCE(NEW.raw_user_meta_data->>'city', 'ville')
        ),
        '[^a-z0-9]+', '-', 'g'
      )
    );

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
