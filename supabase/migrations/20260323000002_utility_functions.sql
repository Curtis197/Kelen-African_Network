-- ============================================================
-- Migration 002: Utility Functions
-- ============================================================

-- Reusable trigger function: auto-sets updated_at to NOW() on UPDATE.
-- Applied to every mutable table via individual triggers.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Avoid infinite recursion in RLS policies by using a SECURITY DEFINER function.
-- This allows checking the role without triggering RLS recursively.
CREATE OR REPLACE FUNCTION public.has_role(check_role text)
RETURNS boolean AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM public.users WHERE id = auth.uid();
  RETURN current_role = check_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
