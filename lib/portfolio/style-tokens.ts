// lib/portfolio/style-tokens.ts

export const STYLE_QUESTIONS = [
  {
    id: "imageShape",
    label: "Forme des images",
    options: [
      { value: "sharp",   label: "Angles nets",         description: "Moderne & précis" },
      { value: "rounded", label: "Légèrement arrondi",  description: "Doux & professionnel" },
      { value: "pill",    label: "Très arrondi",        description: "Accueillant & friendly" },
    ],
  },
  {
    id: "mood",
    label: "Ambiance générale",
    options: [
      { value: "light", label: "Clair & épuré",   description: "Aérien & minimaliste" },
      { value: "dark",  label: "Sombre & fort",   description: "Impact & autorité" },
      { value: "warm",  label: "Chaud & naturel", description: "Chaleur & authenticité" },
    ],
  },
  {
    id: "imageWeight",
    label: "Priorité visuelle",
    options: [
      { value: "image",    label: "Images en avant",    description: "Votre travail parle" },
      { value: "balanced", label: "Équilibré",           description: "Image & texte ensemble" },
      { value: "text",     label: "Infos en avant",     description: "Clair & lisible" },
    ],
  },
  {
    id: "spacing",
    label: "Densité de la page",
    options: [
      { value: "spacious",  label: "Aéré & éditorial", description: "Magazine haut de gamme" },
      { value: "standard",  label: "Standard",          description: "Equilibré & lisible" },
      { value: "compact",   label: "Dense & direct",    description: "Maximum d'infos" },
    ],
  },
] as const;

export type StyleAnswers = {
  imageShape: "sharp" | "rounded" | "pill";
  mood: "light" | "dark" | "warm" | "logo-color";
  imageWeight: "image" | "balanced" | "text";
  spacing: "spacious" | "standard" | "compact";
};

/**
 * Map quiz answers to CSS variable values.
 * These are injected as a <style> block on the portfolio page.
 */
export function buildCssVars(tokens: Partial<StyleAnswers>): Record<string, string> {
  const vars: Record<string, string> = {};

  // Image border radius
  const radiusMap = { sharp: "0px", rounded: "12px", pill: "24px" };
  if (tokens.imageShape) vars["--portfolio-img-radius"] = radiusMap[tokens.imageShape];

  // Card border radius (slightly less than image)
  const cardRadiusMap = { sharp: "0px", rounded: "8px", pill: "16px" };
  if (tokens.imageShape) vars["--portfolio-card-radius"] = cardRadiusMap[tokens.imageShape];

  // Mood: surface and text colors
  const moodMap = {
    light: {
      "--portfolio-bg":         "#ffffff",
      "--portfolio-surface":    "#f8f8f6",
      "--portfolio-on-bg":      "#1a1a1a",
      "--portfolio-on-surface": "#2d2d2d",
      "--portfolio-overlay":    "rgba(0,0,0,0.35)",
    },
    dark: {
      "--portfolio-bg":         "#0f0f0f",
      "--portfolio-surface":    "#1a1a1a",
      "--portfolio-on-bg":      "#f5f5f5",
      "--portfolio-on-surface": "#e0e0e0",
      "--portfolio-overlay":    "rgba(0,0,0,0.55)",
    },
    warm: {
      "--portfolio-bg":         "#faf7f2",
      "--portfolio-surface":    "#f2ece2",
      "--portfolio-on-bg":      "#2c1f0e",
      "--portfolio-on-surface": "#3d2b15",
      "--portfolio-overlay":    "rgba(30,15,0,0.45)",
    },
  };
  if (tokens.mood && tokens.mood in moodMap) Object.assign(vars, moodMap[tokens.mood as keyof typeof moodMap]);

  // Hero image height based on imageWeight
  const heroHeightMap = { image: "90vh", balanced: "80vh", text: "60vh" };
  if (tokens.imageWeight) vars["--portfolio-hero-height"] = heroHeightMap[tokens.imageWeight];

  // Section padding based on spacing
  const paddingMap = { spacious: "8rem", standard: "6rem", compact: "4rem" };
  if (tokens.spacing) vars["--portfolio-section-padding"] = paddingMap[tokens.spacing];

  return vars;
}

/**
 * Render CSS vars object as a <style> string for injection.
 */
export function renderStyleTag(tokens: Partial<StyleAnswers>): string {
  const vars = buildCssVars(tokens);
  if (Object.keys(vars).length === 0) return "";
  const declarations = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `<style>:root {\n${declarations}\n}</style>`;
}
