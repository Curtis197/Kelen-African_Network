-- ============================================================
-- Migration 013: Business Logic Functions
-- ============================================================

-- ── 1. generate_professional_slug() ───────────────────────
-- Trigger function: generates a unique slug from business_name + city.
-- Called BEFORE INSERT on professionals.
-- Slugifies to lowercase-hyphenated, appends -N if collision.

CREATE OR REPLACE FUNCTION generate_professional_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter   INTEGER := 1;
BEGIN
  -- Slugify: lowercase, replace accented chars, collapse non-alphanum to hyphens
  base_slug := lower(
    regexp_replace(
      translate(
        NEW.business_name || '-' || NEW.city,
        'àáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞ',
        'aaaaaaeceeeeiiiidnoooooouuuuytya aaaaaaeceeeeiiiidnoooooouuuuyty'
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' FROM base_slug);

  candidate := base_slug;

  -- Check uniqueness, append counter if needed
  WHILE EXISTS (SELECT 1 FROM professionals WHERE slug = candidate AND id != COALESCE(NEW.id, uuid_generate_v4())) LOOP
    candidate := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. compute_professional_status(prof_id UUID) ──────────
-- Core business logic: recalculates and persists the 5-tier status.
-- Called by triggers after any change to recommendations, signals, or reviews.
-- Signals always take priority over recommendations.

CREATE OR REPLACE FUNCTION compute_professional_status(prof_id UUID)
RETURNS void AS $$
DECLARE
  sig_count    INTEGER;
  rec_count    INTEGER;
  new_rating   NUMERIC(3,2);
  new_pct      NUMERIC(5,2);
  new_count    INTEGER;
  new_status   TEXT;
BEGIN
  -- ── Step 1: Count verified signals (priority) ─────────────
  SELECT COUNT(*) INTO sig_count
  FROM signals
  WHERE professional_id = prof_id AND verified = TRUE;

  IF sig_count >= 3 THEN
    new_status := 'black';
  ELSIF sig_count >= 1 THEN
    new_status := 'red';
  ELSE
    -- ── Step 2: Count verified + linked recommendations ──────
    SELECT COUNT(*) INTO rec_count
    FROM recommendations
    WHERE professional_id = prof_id
      AND verified = TRUE
      AND linked   = TRUE;

    -- ── Step 3: Compute review metrics (from non-hidden reviews) ─
    SELECT
      ROUND(AVG(rating)::NUMERIC, 2),
      ROUND(
        (COUNT(*) FILTER (WHERE rating >= 4)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
        2
      ),
      COUNT(*)
    INTO new_rating, new_pct, new_count
    FROM reviews
    WHERE professional_id = prof_id AND is_hidden = FALSE;

    -- ── Step 4: Apply thresholds ─────────────────────────────
    -- NULL ratings (no reviews) do not block promotion
    IF rec_count >= 5
       AND (new_rating IS NULL OR new_rating >= 4.5)
       AND (new_pct    IS NULL OR new_pct    >= 90)
    THEN
      new_status := 'gold';
    ELSIF rec_count >= 1
       AND (new_rating IS NULL OR new_rating >= 4.0)
       AND (new_pct    IS NULL OR new_pct    >= 80)
    THEN
      new_status := 'silver';
    ELSE
      new_status := 'white';
    END IF;
  END IF;

  -- ── Step 5: Persist ───────────────────────────────────────
  UPDATE professionals SET
    status               = new_status,
    recommendation_count = COALESCE(rec_count, 0),
    signal_count         = sig_count,
    avg_rating           = new_rating,
    positive_review_pct  = new_pct,
    review_count         = COALESCE(new_count, 0)
  WHERE id = prof_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper trigger function (calls compute with the professional_id from the row)
CREATE OR REPLACE FUNCTION trigger_compute_status()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM compute_professional_status(NEW.professional_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 3. update_professional_visibility() ───────────────────
-- Trigger function on subscriptions.
-- Sets professionals.is_visible = TRUE when subscription is active,
-- FALSE when canceled or past_due.

CREATE OR REPLACE FUNCTION update_professional_visibility()
RETURNS TRIGGER AS $$
DECLARE
  is_vis BOOLEAN;
  is_act BOOLEAN;
BEGIN
  -- Determine if subscription makes the pro visible
  is_vis := (NEW.status = 'active');

  -- Respect is_active flag (admin can disable independently)
  SELECT is_active INTO is_act
  FROM professionals WHERE id = NEW.professional_id;

  UPDATE professionals
  SET is_visible = (is_vis AND COALESCE(is_act, TRUE))
  WHERE id = NEW.professional_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. snapshot_professional_on_add() ─────────────────────
-- Trigger function on project_professionals BEFORE INSERT.
-- Captures the Kelen pro's public data into pro_snapshot JSONB
-- so the client dashboard shows stable info even if pro deactivates.

CREATE OR REPLACE FUNCTION snapshot_professional_on_add()
RETURNS TRIGGER AS $$
DECLARE
  snap JSONB;
BEGIN
  IF NEW.is_external = FALSE AND NEW.professional_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'business_name', business_name,
      'category',      category,
      'status',        status,
      'slug',          slug,
      'city',          city,
      'country',       country
    )
    INTO snap
    FROM professionals
    WHERE id = NEW.professional_id;

    NEW.pro_snapshot := snap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. save_review_history() ──────────────────────────────
-- Trigger function on reviews BEFORE UPDATE.
-- Records previous values before overwrite for admin audit trail.

CREATE OR REPLACE FUNCTION save_review_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.rating != NEW.rating OR OLD.comment IS DISTINCT FROM NEW.comment THEN
    INSERT INTO review_history (review_id, previous_rating, previous_comment)
    VALUES (OLD.id, OLD.rating, OLD.comment);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. add_to_verification_queue() ────────────────────────
-- Trigger function: auto-inserts a queue item on new submission.

CREATE OR REPLACE FUNCTION add_to_verification_queue()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO verification_queue (item_type, item_id, professional_id)
  VALUES (TG_ARGV[0], NEW.id, NEW.professional_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. track_profile_view(...) ────────────────────────────
-- Records an analytics view for a professional profile.
-- No billing deduction (CPM removed).
-- Called from server-side only (service role).

CREATE OR REPLACE FUNCTION track_profile_view(
  prof_id       UUID,
  viewer_ip     TEXT,
  viewer_country TEXT DEFAULT NULL,
  viewer_city   TEXT DEFAULT NULL,
  p_source      TEXT DEFAULT 'direct',
  search_query  TEXT DEFAULT NULL,
  referrer      TEXT DEFAULT NULL,
  duration_sec  INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO profile_views (
    professional_id,
    viewer_ip_hash,
    viewer_country,
    viewer_city,
    source,
    search_query,
    referrer,
    cost_deducted,
    view_duration
  ) VALUES (
    prof_id,
    encode(digest(viewer_ip, 'sha256'), 'hex'),  -- SHA-256 hash, never store raw IP
    viewer_country,
    viewer_city,
    p_source,
    search_query,
    referrer,
    0.0000,     -- always 0, CPM removed
    duration_sec
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
