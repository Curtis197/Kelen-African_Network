// ──────────────────────────────────────────────
// Mapping des catégories Kelen → Google Business Profile
// Référence : https://support.google.com/business/answer/3038177
// ──────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  // Construction & Bâtiment
  maçonnerie: "gcid:masonry_contractor",
  "maçon": "gcid:masonry_contractor",
  plomberie: "gcid:plumber",
  plombier: "gcid:plumber",
  "électricité": "gcid:electrician",
  "électricien": "gcid:electrician",
  menuiserie: "gcid:carpenter",
  menuisier: "gcid:carpenter",
  charpente: "gcid:carpenter",
  peinture: "gcid:painter",
  peintre: "gcid:painter",
  carrelage: "gcid:tile_contractor",
  carreleur: "gcid:tile_contractor",
  toiture: "gcid:roofing_contractor",
  couverture: "gcid:roofing_contractor",
  climatisation: "gcid:hvac_contractor",
  plombier_chauffagiste: "gcid:hvac_contractor",
  "rénovation": "gcid:general_contractor",
  renovation: "gcid:general_contractor",
  construction: "gcid:general_contractor",
  "génie civil": "gcid:civil_engineer",
  architecture: "gcid:architect",
  architecte: "gcid:architect",
  // Finitions
  "revêtement de sol": "gcid:flooring_contractor",
  parquet: "gcid:flooring_contractor",
  vitrage: "gcid:glass_industry",
  vitrerie: "gcid:glass_industry",
  isolation: "gcid:insulation_contractor",
  // Digital & Tech
  "développeur": "gcid:software_company",
  "développement web": "gcid:software_company",
  designer: "gcid:graphic_designer",
  "web designer": "gcid:graphic_designer",
  webmaster: "gcid:internet_marketing_service",
  "marketing digital": "gcid:internet_marketing_service",
  // Autres services
  "nettoyage": "gcid:janitorial_service",
  "entretien": "gcid:building_maintenance",
  "sécurité": "gcid:security_service",
  paysagisme: "gcid:landscaper",
  "aménagement extérieur": "gcid:landscaper",
  // Fallback
  default: "gcid:contractor",
};

export function mapKelenCategoryToGBP(kelenCategory: string | null | undefined): string {
  if (!kelenCategory) return CATEGORY_MAP.default;

  const normalized = kelenCategory.toLowerCase().trim();

  // Exact match
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];

  // Partial match — finds first key that is contained in the category string
  const partialMatch = Object.keys(CATEGORY_MAP).find(
    (key) => key !== "default" && normalized.includes(key)
  );

  return partialMatch ? CATEGORY_MAP[partialMatch] : CATEGORY_MAP.default;
}
