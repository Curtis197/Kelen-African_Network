-- ============================================================
-- Migration: Pro Project Client Contacts & Invitation System
-- ============================================================
-- Allows professionals to create client contacts for their projects.
-- Clients receive an invitation email/link to create an account.
-- When a client registers with the invited email, their account
-- is linked to the existing pro_project record.

-- ── pro_project_clients ─────────────────────────────────────
-- Stores client contact info for pro projects.
-- Can exist before the client has a Kelen account.

CREATE TABLE pro_project_clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_project_id        UUID NOT NULL REFERENCES pro_projects(id) ON DELETE CASCADE,
  created_by_pro_id     UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,

  -- Client info (provided by pro)
  client_name           TEXT NOT NULL,
  client_email          TEXT NOT NULL,
  client_phone          TEXT,

  -- Invitation tracking
  invitation_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  invitation_sent_at    TIMESTAMPTZ,
  invitation_token      TEXT UNIQUE,  -- Secure random token for invite link
  invitation_verified   BOOLEAN NOT NULL DEFAULT FALSE,  -- Client confirmed via email/link
  invitation_verified_at TIMESTAMPTZ,

  -- Link to actual user account (set when client registers)
  linked_user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  linked_at             TIMESTAMPTZ,

  -- Status
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'invited', 'verified', 'linked', 'cancelled')),

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_project_clients_project ON pro_project_clients(pro_project_id);
CREATE INDEX idx_pro_project_clients_email ON pro_project_clients(client_email);
CREATE INDEX idx_pro_project_clients_token ON pro_project_clients(invitation_token)
  WHERE invitation_token IS NOT NULL;
CREATE INDEX idx_pro_project_clients_linked_user ON pro_project_clients(linked_user_id);

CREATE TRIGGER set_updated_at_pro_project_clients
  BEFORE UPDATE ON pro_project_clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE pro_project_clients ENABLE ROW LEVEL SECURITY;

-- Professional: manage clients on their own projects
CREATE POLICY "pro_clients_own_project" ON pro_project_clients
  FOR ALL USING (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    pro_project_id IN (
      SELECT pp.id FROM pro_projects pp
      JOIN professionals p ON pp.professional_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Public: can verify invitation by token (used for invite link)
CREATE POLICY "pro_clients_verify_invite" ON pro_project_clients
  FOR SELECT USING (
    status = 'invited'
    AND invitation_token IS NOT NULL
  );

-- Client: can read their own linked record
CREATE POLICY "pro_clients_linked_user_read" ON pro_project_clients
  FOR SELECT USING (
    linked_user_id = auth.uid()
  );

-- Admin: full access
CREATE POLICY "pro_clients_admin" ON pro_project_clients
  FOR ALL USING (public.has_role('admin'));

-- ── Function: Auto-link client on registration ──────────────
-- When a user registers with an email that matches an invited client,
-- link their account automatically.

CREATE OR REPLACE FUNCTION public.link_client_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a pending/invited/verified client with this email
  UPDATE pro_project_clients
  SET 
    linked_user_id = NEW.id,
    linked_at = NOW(),
    status = 'linked'
  WHERE 
    client_email = NEW.email
    AND status IN ('invited', 'verified')
    AND linked_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user creation
CREATE TRIGGER trigger_link_client_on_registration
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_client_on_registration();
