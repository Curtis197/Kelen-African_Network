-- Unified taxonomy: professional_areas + professions tables
-- Replaces both CATEGORIES constant and DEVELOPMENT_AREAS constant.

-- 1. Areas table
CREATE TABLE professional_areas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Professions table (1 profession → 1 area)
CREATE TABLE professions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id    UUID NOT NULL REFERENCES professional_areas(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (area_id, name)
);

CREATE INDEX idx_professions_area ON professions(area_id);

-- 3. Add FK columns to professionals
ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS area_id       UUID REFERENCES professional_areas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profession_id UUID REFERENCES professions(id) ON DELETE SET NULL;

-- 4. RLS
ALTER TABLE professional_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "areas_public_read"       ON professional_areas FOR SELECT USING (true);
CREATE POLICY "professions_public_read" ON professions        FOR SELECT USING (true);
CREATE POLICY "areas_admin"             ON professional_areas FOR ALL USING (public.has_role('admin'));
CREATE POLICY "professions_admin"       ON professions        FOR ALL USING (public.has_role('admin'));

-- 5. Seed areas
INSERT INTO professional_areas (name, slug, sort_order) VALUES
  ('Architecture & Design',       'architecture-design',       1),
  ('Bâtiment & Travaux Publics',  'batiment-travaux-publics',  2),
  ('Rénovation & Finitions',      'renovation-finitions',      3),
  ('Ingénierie & Génie Civil',    'ingenierie-genie-civil',    4),
  ('Immobilier & Foncier',        'immobilier-foncier',        5),
  ('Juridique & Administratif',   'juridique-administratif',   6),
  ('Expertise & Conseil',         'expertise-conseil',         7),
  ('Éducation & Formation',       'education-formation',       8),
  ('Santé & Bien-être',           'sante-bien-etre',           9),
  ('Digital & Tech',              'digital-tech',              10),
  ('Services à la personne',      'services-personne',         11),
  ('Commerce & Vente',            'commerce-vente',            12),
  ('Mécanique & Réparation',      'mecanique-reparation',      13),
  ('Marketing & Événementiel',    'marketing-evenementiel',    14),
  ('Autre',                       'autre',                     15);

-- 6. Seed professions
WITH a AS (SELECT id, slug FROM professional_areas)
INSERT INTO professions (area_id, name, slug, sort_order)
SELECT a.id, p.name, p.slug, p.sort_order FROM a
JOIN (VALUES
  ('architecture-design', 'Architecte',                  'architecte',                   1),
  ('architecture-design', 'Architecte d''intérieur',     'architecte-interieur',         2),
  ('architecture-design', 'Designer graphique',          'designer-graphique',           3),
  ('architecture-design', 'Paysagiste',                  'paysagiste',                   4),
  ('architecture-design', 'Décorateur',                  'decorateur',                   5),
  ('batiment-travaux-publics', 'Maçon',                  'macon',                        1),
  ('batiment-travaux-publics', 'Charpentier',            'charpentier',                  2),
  ('batiment-travaux-publics', 'Couvreur',               'couvreur',                     3),
  ('batiment-travaux-publics', 'Plombier',               'plombier',                     4),
  ('batiment-travaux-publics', 'Électricien',            'electricien',                  5),
  ('batiment-travaux-publics', 'Carreleur',              'carreleur',                    6),
  ('batiment-travaux-publics', 'Peintre',                'peintre',                      7),
  ('batiment-travaux-publics', 'Menuisier',              'menuisier',                    8),
  ('batiment-travaux-publics', 'Terrassier',             'terrassier',                   9),
  ('renovation-finitions', 'Plaquiste / Plâtrier',       'plaquiste-platreur',           1),
  ('renovation-finitions', 'Poseur de revêtements',      'poseur-revetements',           2),
  ('renovation-finitions', 'Peintre / Décorateur',       'peintre-decorateur',           3),
  ('renovation-finitions', 'Étancheur',                  'etancheur',                    4),
  ('ingenierie-genie-civil', 'Ingénieur structure',      'ingenieur-structure',          1),
  ('ingenierie-genie-civil', 'Ingénieur VRD',            'ingenieur-vrd',                2),
  ('ingenierie-genie-civil', 'Topographe',               'topographe',                   3),
  ('ingenierie-genie-civil', 'Bureau d''études',         'bureau-etudes',                4),
  ('immobilier-foncier', 'Agent immobilier',             'agent-immobilier',             1),
  ('immobilier-foncier', 'Promoteur immobilier',         'promoteur-immobilier',         2),
  ('immobilier-foncier', 'Notaire',                      'notaire',                      3),
  ('immobilier-foncier', 'Géomètre-expert',              'geometre-expert',              4),
  ('juridique-administratif', 'Avocat',                  'avocat',                       1),
  ('juridique-administratif', 'Huissier de justice',     'huissier',                     2),
  ('juridique-administratif', 'Conseiller juridique',    'conseiller-juridique',         3),
  ('juridique-administratif', 'Expert-comptable',        'expert-comptable',             4),
  ('expertise-conseil', 'Économiste de la construction', 'economiste-construction',      1),
  ('expertise-conseil', 'Chef de projet',                'chef-de-projet',               2),
  ('expertise-conseil', 'Maître d''œuvre',               'maitre-oeuvre',                3),
  ('expertise-conseil', 'Consultant',                    'consultant',                   4),
  ('education-formation', 'Formateur',                   'formateur',                    1),
  ('education-formation', 'Coach',                       'coach',                        2),
  ('education-formation', 'Tuteur / Répétiteur',         'tuteur-repetiteur',            3),
  ('sante-bien-etre', 'Médecin',                         'medecin',                      1),
  ('sante-bien-etre', 'Infirmier(ère)',                   'infirmier',                    2),
  ('sante-bien-etre', 'Kinésithérapeute',                'kinesitherapeute',             3),
  ('sante-bien-etre', 'Nutritionniste',                  'nutritionniste',               4),
  ('sante-bien-etre', 'Psychologue',                     'psychologue',                  5),
  ('digital-tech', 'Développeur web',                    'developpeur-web',              1),
  ('digital-tech', 'Développeur mobile',                 'developpeur-mobile',           2),
  ('digital-tech', 'Designer UI/UX',                     'designer-ui-ux',               3),
  ('digital-tech', 'Administrateur système',             'admin-systeme',                4),
  ('digital-tech', 'Data analyst',                       'data-analyst',                 5),
  ('services-personne', 'Aide à domicile',               'aide-domicile',                1),
  ('services-personne', 'Garde d''enfants',              'garde-enfants',                2),
  ('services-personne', 'Assistant ménager',             'assistant-menager',            3),
  ('services-personne', 'Cuisinier à domicile',          'cuisinier-domicile',           4),
  ('commerce-vente', 'Commercial',                       'commercial',                   1),
  ('commerce-vente', 'Responsable export',               'responsable-export',           2),
  ('commerce-vente', 'Acheteur',                         'acheteur',                     3),
  ('mecanique-reparation', 'Mécanicien auto',            'mecanicien-auto',              1),
  ('mecanique-reparation', 'Électromécanicien',          'electromecanicien',            2),
  ('mecanique-reparation', 'Technicien de maintenance',  'technicien-maintenance',       3),
  ('marketing-evenementiel', 'Chargé de marketing',      'charge-marketing',             1),
  ('marketing-evenementiel', 'Organisateur d''événements','organisateur-evenements',     2),
  ('marketing-evenementiel', 'Photographe',              'photographe',                  3),
  ('marketing-evenementiel', 'Vidéaste',                 'videaste',                     4),
  ('autre', 'Autre profession',                          'autre-profession',             1)
) AS p(area_slug, name, slug, sort_order)
ON a.slug = p.area_slug;

-- 7. Best-effort migration of existing professionals.category → area_id
UPDATE professionals p
SET area_id = pa.id
FROM professional_areas pa
WHERE
  (p.category = 'architecture'     AND pa.slug = 'architecture-design')     OR
  (p.category = 'construction'     AND pa.slug = 'batiment-travaux-publics') OR
  (p.category = 'renovation'       AND pa.slug = 'renovation-finitions')    OR
  (p.category = 'ingenierie'       AND pa.slug = 'ingenierie-genie-civil')   OR
  (p.category = 'juridique'        AND pa.slug = 'juridique-administratif')  OR
  (p.category = 'education'        AND pa.slug = 'education-formation')     OR
  (p.category = 'sante'            AND pa.slug = 'sante-bien-etre')         OR
  (p.category = 'numerique'        AND pa.slug = 'digital-tech')            OR
  (p.category = 'service_personne' AND pa.slug = 'services-personne')       OR
  (p.category = 'commerce'         AND pa.slug = 'commerce-vente')          OR
  (p.category = 'mecanique'        AND pa.slug = 'mecanique-reparation')    OR
  (p.category = 'autre'            AND pa.slug = 'autre');
