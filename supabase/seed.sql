-- ============================================================
-- Kelen Database Seeds
-- ============================================================
-- This script populates the database with initial data for development.
-- It inserts into auth.users, which triggers public.users and 
-- public.professionals creation via the handle_new_user() function.

BEGIN;

-- ── 1. Clean up existing data (Optional, be careful in prod) ──
-- TRUNCATE auth.users CASCADE; 

-- ── 2. Helper: Insert into auth.users ──────────────────────
-- We use a function to simplify insertions into the auth schema
CREATE OR REPLACE FUNCTION seed_auth_user(
    p_id UUID,
    p_email TEXT,
    p_meta JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO auth.users (
        id, 
        email, 
        raw_user_meta_data, 
        encrypted_password, 
        aud, 
        role, 
        email_confirmed_at,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        p_id, 
        p_email, 
        p_meta, 
        -- '$2a$10$abcdefghijklmnopqrstuv' is a placeholder hash for 'password123'
        '$2a$10$abcdefghijklmnopqrstuv', 
        'authenticated', 
        'authenticated', 
        NOW(),
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ── 3. Create Users ─────────────────────────────────────────

-- Admin
SELECT seed_auth_user(
    '00000000-0000-0000-0000-000000000001',
    'admin@kelen.sn',
    '{"first_name": "Admin", "last_name": "Kelen", "role": "admin", "country": "SN"}'::jsonb
);

-- Clients
SELECT seed_auth_user(
    '10000000-0000-0000-0000-000000000001',
    'diaspora.user@gmail.com',
    '{"first_name": "Jean", "last_name": "Dupont", "role": "client", "country": "FR", "phone": "+33123456789"}'::jsonb
);

SELECT seed_auth_user(
    '10000000-0000-0000-0000-000000000002',
    'investor.test@gmail.com',
    '{"first_name": "Marie", "last_name": "Sow", "role": "client", "country": "CI", "phone": "+22501020304"}'::jsonb
);

-- Professionals
-- Pro 1: Moussa Diallo (Construction, Dakar) -> Will be Gold
SELECT seed_auth_user(
    '20000000-0000-0000-0000-000000000001',
    'moussa.diallo@pro.sn',
    '{"first_name": "Moussa", "last_name": "Diallo", "role": "pro_africa", "country": "SN", "city": "Dakar", "business_name": "Diallo Construction SARL", "category": "construction", "phone": "+221770000001"}'::jsonb
);

-- Pro 2: Jean Kouadio (Plomberie, Abidjan) -> Will be Silver
SELECT seed_auth_user(
    '20000000-0000-0000-0000-000000000002',
    'jean.kouadio@pro.ci',
    '{"first_name": "Jean", "last_name": "Kouadio", "role": "pro_africa", "country": "CI", "city": "Abidjan", "business_name": "Kouadio Plomberie Pro", "category": "plomberie", "phone": "+225070000001"}'::jsonb
);

-- Pro 3: Fatou Sagna (Menuiserie, Saint-Louis) -> Will be Red
SELECT seed_auth_user(
    '20000000-0000-0000-0000-000000000003',
    'fatou.sagna@pro.sn',
    '{"first_name": "Fatou", "last_name": "Sagna", "role": "pro_africa", "country": "SN", "city": "Saint-Louis", "business_name": "Sagna Design Bois", "category": "menuiserie", "phone": "+221700000001"}'::jsonb
);

-- Pro 4: Ibrahim Traoré (Électricité, Bamako) -> Will be Black
SELECT seed_auth_user(
    '20000000-0000-0000-0000-000000000004',
    'ibrahim.traore@pro.ml',
    '{"first_name": "Ibrahim", "last_name": "Traore", "role": "pro_africa", "country": "ML", "city": "Bamako", "business_name": "Traore Electricite", "category": "electricite", "phone": "+223650000001"}'::jsonb
);

-- Pro 5: Alice Beka (Peinture, Libreville) -> Will be White
SELECT seed_auth_user(
    '20000000-0000-0000-0000-000000000005',
    'alice.beka@pro.ga',
    '{"first_name": "Alice", "last_name": "Beka", "role": "pro_africa", "country": "GA", "city": "Libreville", "business_name": "Beka Peinture Deco", "category": "peinture", "phone": "+241600000001"}'::jsonb
);

-- ── 4. Create Active Subscriptions (to make them visible) ──

INSERT INTO public.subscriptions (professional_id, plan, status)
SELECT id, 'pro_africa', 'active'
FROM public.professionals;

-- ── 5. Create Recommendations ──────────────────────────────
-- Moussa (Pro 1) gets 5 recommendations -> Gold status target
INSERT INTO public.recommendations (professional_id, professional_slug, submitter_id, submitter_name, submitter_country, submitter_email, project_type, project_description, completion_date, budget_range, location, contract_url, photo_urls, verified, linked, status)
VALUES 
(
    (SELECT id FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    (SELECT slug FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    '10000000-0000-0000-0000-000000000001', 'Jean Dupont', 'FR', 'diaspora.user@gmail.com',
    'construction', 'Construction d''une villa R+1 à Saly.', '2024-01-15', '50k-100k', 'Saly, Sénégal',
    'contracts/demo-contract-1.pdf', ARRAY['photos/completion-1.jpg'], TRUE, TRUE, 'verified'
),
(
    (SELECT id FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    (SELECT slug FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    '10000000-0000-0000-0000-000000000001', 'Jean Dupont', 'FR', 'diaspora.user@gmail.com',
    'construction', 'Extension terrasse et piscine.', '2024-05-20', '25k-50k', 'Dakar, Sénégal',
    'contracts/demo-contract-2.pdf', ARRAY['photos/completion-2.jpg'], TRUE, TRUE, 'verified'
),
(
    (SELECT id FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    (SELECT slug FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    '10000000-0000-0000-0000-000000000002', 'Marie Sow', 'CI', 'investor.test@gmail.com',
    'construction', 'Rénovation complète appartement Plateau.', '2023-11-10', '10k-25k', 'Abidjan, CI',
    'contracts/demo-contract-3.pdf', ARRAY['photos/completion-3.jpg'], TRUE, TRUE, 'verified'
),
(
    (SELECT id FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    (SELECT slug FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    '10000000-0000-0000-0000-000000000002', 'Marie Sow', 'CI', 'investor.test@gmail.com',
    'construction', 'Construction mur de clôture.', '2023-08-05', '0-10k', 'Assinie, CI',
    'contracts/demo-contract-4.pdf', ARRAY['photos/completion-4.jpg'], TRUE, TRUE, 'verified'
),
(
    (SELECT id FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    (SELECT slug FROM professionals WHERE business_name = 'Diallo Construction SARL'),
    '10000000-0000-0000-0000-000000000001', 'Jean Dupont', 'FR', 'diaspora.user@gmail.com',
    'construction', 'Réfection toiture hangar.', '2024-02-28', '10k-25k', 'Thies, Sénégal',
    'contracts/demo-contract-5.pdf', ARRAY['photos/completion-5.jpg'], TRUE, TRUE, 'verified'
);

-- Jean (Pro 2) gets 2 recommendations -> Silver status target
INSERT INTO public.recommendations (professional_id, professional_slug, submitter_id, submitter_name, submitter_country, submitter_email, project_type, project_description, completion_date, budget_range, location, contract_url, photo_urls, verified, linked, status)
VALUES 
(
    (SELECT id FROM professionals WHERE business_name = 'Kouadio Plomberie Pro'),
    (SELECT slug FROM professionals WHERE business_name = 'Kouadio Plomberie Pro'),
    '10000000-0000-0000-0000-000000000002', 'Marie Sow', 'CI', 'investor.test@gmail.com',
    'plomberie', 'Installation plomberie neuve villa.', '2024-03-10', '0-10k', 'Bingerville, CI',
    'contracts/demo-contract-6.pdf', ARRAY['photos/completion-6.jpg'], TRUE, TRUE, 'verified'
),
(
    (SELECT id FROM professionals WHERE business_name = 'Kouadio Plomberie Pro'),
    (SELECT slug FROM professionals WHERE business_name = 'Kouadio Plomberie Pro'),
    '10000000-0000-0000-0000-000000000001', 'Jean Dupont', 'FR', 'diaspora.user@gmail.com',
    'plomberie', 'Dépannage réseau eau chaude.', '2024-04-05', '0-10k', 'Dakar, SN',
    'contracts/demo-contract-7.pdf', ARRAY['photos/completion-7.jpg'], TRUE, TRUE, 'verified'
);

-- ── 6. Create Signals ───────────────────────────────────────
-- Fatou (Pro 3) gets 1 signal -> Red status target
INSERT INTO public.signals (professional_id, professional_slug, submitter_id, submitter_name, submitter_country, submitter_email, breach_type, breach_description, severity, agreed_start_date, agreed_end_date, contract_url, evidence_urls, verified, status)
VALUES 
(
    (SELECT id FROM professionals WHERE business_name = 'Sagna Design Bois'),
    (SELECT slug FROM professionals WHERE business_name = 'Sagna Design Bois'),
    '10000000-0000-0000-0000-000000000001', 'Jean Dupont', 'FR', 'diaspora.user@gmail.com',
    'quality', 'Finition des portes non conforme au devis et bois non traité.', 'minor', '2023-12-01', '2024-01-15',
    'contracts/bad-contract-1.pdf', ARRAY['evidence/defect-1.jpg'], TRUE, 'verified'
);

-- Ibrahim (Pro 4) gets 3 signals -> Black status target
INSERT INTO public.signals (professional_id, professional_slug, submitter_id, submitter_name, submitter_country, submitter_email, breach_type, breach_description, severity, agreed_start_date, agreed_end_date, contract_url, evidence_urls, verified, status)
VALUES 
(
    (SELECT id FROM professionals WHERE business_name = 'Traore Electricite'),
    (SELECT slug FROM professionals WHERE business_name = 'Traore Electricite'),
    '10000000-0000-0000-0000-000000000001', 'Jean Dupont', 'FR', 'diaspora.user@gmail.com',
    'abandonment', 'Chantier abandonné après versement de l''acompte de 50%.', 'critical', '2024-01-10', '2024-02-10',
    'contracts/bad-contract-2.pdf', ARRAY['evidence/abandon-1.jpg'], TRUE, 'verified'
),
(
    (SELECT id FROM professionals WHERE business_name = 'Traore Electricite'),
    (SELECT slug FROM professionals WHERE business_name = 'Traore Electricite'),
    '10000000-0000-0000-0000-000000000002', 'Marie Sow', 'CI', 'investor.test@gmail.com',
    'fraud', 'Falsification de factures de matériel.', 'critical', '2023-09-15', '2023-10-15',
    'contracts/bad-contract-3.pdf', ARRAY['evidence/fraud-1.jpg'], TRUE, 'verified'
),
(
    (SELECT id FROM professionals WHERE business_name = 'Traore Electricite'),
    (SELECT slug FROM professionals WHERE business_name = 'Traore Electricite'),
    '10000000-0000-0000-0000-000000000002', 'Marie Sow', 'CI', 'investor.test@gmail.com',
    'quality', 'Installation électrique dangereuse et non conforme aux normes.', 'major', '2023-11-20', '2023-12-20',
    'contracts/bad-contract-4.pdf', ARRAY['evidence/short-circuit-1.jpg'], TRUE, 'verified'
);

-- ── 7. Create Reviews ─────────────────────────────────────────
-- Moussa (Pro 1) reviews (all high)
INSERT INTO public.reviews (professional_id, reviewer_id, reviewer_name, reviewer_country, rating, comment)
VALUES 
((SELECT id FROM professionals WHERE business_name = 'Diallo Construction SARL'), '10000000-0000-0000-0000-000000000001', 'Jean Dupont', 'FR', 5, 'Excellent travail, très professionnel.'),
((SELECT id FROM professionals WHERE business_name = 'Diallo Construction SARL'), '10000000-0000-0000-0000-000000000002', 'Marie Sow', 'CI', 4, 'Bonne communication et respect des délais.');

-- Jean (Pro 2) reviews
INSERT INTO public.reviews (professional_id, reviewer_id, reviewer_name, reviewer_country, rating, comment)
VALUES 
((SELECT id FROM professionals WHERE business_name = 'Kouadio Plomberie Pro'), '10000000-0000-0000-0000-000000000002', 'Marie Sow', 'CI', 4, 'Travail soigné.');

-- ── 8. Recalculate Statuses ──────────────────────────────────
-- We call the compute_professional_status function for each pro to ensure 
-- their status correctly reflects the injected data.

DO $$
DECLARE
    p_id UUID;
BEGIN
    FOR p_id IN SELECT id FROM public.professionals LOOP
        PERFORM public.compute_professional_status(p_id);
    END LOOP;
END $$;

-- ── 9. Cleanup Helper ────────────────────────────────────────
DROP FUNCTION seed_auth_user;

COMMIT;
