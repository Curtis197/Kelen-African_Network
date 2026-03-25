-- ============================================================
-- Migration 003: Users
-- ============================================================
-- Mirrors Supabase Auth. id = auth.uid().
-- Role values updated per kelen-evolution-strategique.md:
--   client     → diaspora member (was: user)
--   pro_africa → professional based in Africa
--   pro_europe → African professional based in Europe
--   admin      → Kelen team

CREATE TABLE users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'client'
                        CHECK (role IN ('client', 'pro_africa', 'pro_europe', 'admin')),
  country             TEXT NOT NULL,          -- ISO 3166-1 alpha-2 (e.g. 'FR', 'CI', 'SN')
  phone               TEXT,
  email_notifications BOOLEAN DEFAULT TRUE,
  language            TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  last_login_at       TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Each user can read their own row
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Each user can update their own row but cannot change role or email
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role   = (SELECT role  FROM users WHERE id = auth.uid())
    AND email  = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Admin has full access to all rows
CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
