-- Add pro_intl to users role check constraint.
-- Without this, professionals from countries outside Africa/Europe get role='pro_intl'
-- which fails the constraint in the auth trigger, causing "Database error saving new user".

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['client', 'pro_africa', 'pro_europe', 'pro_intl', 'admin']));
