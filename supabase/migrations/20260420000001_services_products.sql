-- ============================================================
-- Professional Services & Products Tables
-- ============================================================

-- ── professional_services ─────────────────────────────────

CREATE TABLE professional_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  price           DECIMAL(12,2),
  currency        TEXT DEFAULT 'XOF',
  duration        TEXT,
  category        TEXT,
  is_featured     BOOLEAN DEFAULT FALSE,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── service_images ────────────────────────────────────────

CREATE TABLE service_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES professional_services(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_main     BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── professional_products ─────────────────────────────────

CREATE TABLE professional_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  price           DECIMAL(12,2),
  currency        TEXT DEFAULT 'XOF',
  availability    TEXT DEFAULT 'available' CHECK (availability IN ('available','limited','out_of_stock')),
  category        TEXT,
  is_featured     BOOLEAN DEFAULT FALSE,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── product_images ────────────────────────────────────────

CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES professional_products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_main     BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_services_professional_id  ON professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_products_professional_id  ON professional_products(professional_id);

-- ── Auto-update triggers ──────────────────────────────────

CREATE TRIGGER set_updated_at_services
  BEFORE UPDATE ON professional_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON professional_products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────

ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images        ENABLE ROW LEVEL SECURITY;

-- ── professional_services policies ───────────────────────

-- Public: browse services of visible professionals
CREATE POLICY "services_public_browse" ON professional_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professionals
      WHERE professionals.id = professional_services.professional_id
      AND professionals.is_visible = TRUE
    )
  );

-- Pro: manage own services
CREATE POLICY "services_pro_manage" ON professional_services
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "services_admin_all" ON professional_services
  FOR ALL USING (public.has_role('admin'));

-- ── service_images policies ───────────────────────────────

-- Public: read images from visible professionals
CREATE POLICY "service_images_public_browse" ON service_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_services ps
      JOIN professionals p ON p.id = ps.professional_id
      WHERE ps.id = service_images.service_id
      AND p.is_visible = TRUE
    )
  );

-- Pro: manage images on their own services
CREATE POLICY "service_images_pro_manage" ON service_images
  FOR ALL USING (
    service_id IN (
      SELECT ps.id FROM professional_services ps
      JOIN professionals p ON p.id = ps.professional_id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    service_id IN (
      SELECT ps.id FROM professional_services ps
      JOIN professionals p ON p.id = ps.professional_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "service_images_admin_all" ON service_images
  FOR ALL USING (public.has_role('admin'));

-- ── professional_products policies ───────────────────────

-- Public: browse products of visible professionals
CREATE POLICY "products_public_browse" ON professional_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professionals
      WHERE professionals.id = professional_products.professional_id
      AND professionals.is_visible = TRUE
    )
  );

-- Pro: manage own products
CREATE POLICY "products_pro_manage" ON professional_products
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "products_admin_all" ON professional_products
  FOR ALL USING (public.has_role('admin'));

-- ── product_images policies ───────────────────────────────

-- Public: read images from visible professionals
CREATE POLICY "product_images_public_browse" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_products pp
      JOIN professionals p ON p.id = pp.professional_id
      WHERE pp.id = product_images.product_id
      AND p.is_visible = TRUE
    )
  );

-- Pro: manage images on their own products
CREATE POLICY "product_images_pro_manage" ON product_images
  FOR ALL USING (
    product_id IN (
      SELECT pp.id FROM professional_products pp
      JOIN professionals p ON p.id = pp.professional_id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT pp.id FROM professional_products pp
      JOIN professionals p ON p.id = pp.professional_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY "product_images_admin_all" ON product_images
  FOR ALL USING (public.has_role('admin'));
