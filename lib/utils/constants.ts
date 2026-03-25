// ============================================
// Kelen — Constants
// ============================================

export const CATEGORIES = [
  { value: "construction", label: "Construction" },
  { value: "renovation", label: "Rénovation" },
  { value: "plomberie", label: "Plomberie" },
  { value: "electricite", label: "Électricité" },
  { value: "menuiserie", label: "Menuiserie" },
  { value: "carrelage", label: "Carrelage" },
  { value: "peinture", label: "Peinture" },
  { value: "architecture", label: "Architecture" },
  { value: "ingenierie", label: "Ingénierie" },
  { value: "autre", label: "Autre" },
] as const;

export const COUNTRIES = [
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "SN", label: "Sénégal" },
  { value: "ML", label: "Mali" },
  { value: "BF", label: "Burkina Faso" },
  { value: "GN", label: "Guinée" },
  { value: "CM", label: "Cameroun" },
  { value: "CD", label: "RD Congo" },
  { value: "CG", label: "Congo" },
  { value: "GA", label: "Gabon" },
  { value: "BJ", label: "Bénin" },
  { value: "TG", label: "Togo" },
  { value: "NE", label: "Niger" },
  { value: "TD", label: "Tchad" },
  { value: "MG", label: "Madagascar" },
  { value: "MA", label: "Maroc" },
  { value: "TN", label: "Tunisie" },
  { value: "DZ", label: "Algérie" },
] as const;

export const DIASPORA_COUNTRIES = [
  { value: "FR", label: "France" },
  { value: "BE", label: "Belgique" },
  { value: "CH", label: "Suisse" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "États-Unis" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "DE", label: "Allemagne" },
  { value: "IT", label: "Italie" },
  { value: "ES", label: "Espagne" },
  { value: "PT", label: "Portugal" },
] as const;

export const BUDGET_RANGES = [
  { value: "0-10k", label: "0 — 10 000 €" },
  { value: "10k-25k", label: "10 000 — 25 000 €" },
  { value: "25k-50k", label: "25 000 — 50 000 €" },
  { value: "50k-100k", label: "50 000 — 100 000 €" },
  { value: "100k+", label: "100 000 € +" },
] as const;

export const BREACH_TYPES = [
  { value: "timeline", label: "Non-respect des délais" },
  { value: "budget", label: "Dépassement budgétaire" },
  { value: "quality", label: "Qualité insuffisante" },
  { value: "abandonment", label: "Abandon de chantier" },
  { value: "fraud", label: "Autre manquement grave" },
] as const;

export const SEVERITY_LEVELS = [
  { value: "minor", label: "Mineur" },
  { value: "major", label: "Majeur" },
  { value: "critical", label: "Critique" },
] as const;

export const STATUS_CONFIG = {
  gold: {
    label: "Liste Or",
    emoji: "🟡",
    bgClass: "bg-kelen-yellow-50",
    borderClass: "border-kelen-yellow-500",
    textClass: "text-kelen-yellow-800",
  },
  silver: {
    label: "Liste Argent",
    emoji: "⚪",
    bgClass: "bg-stone-50",
    borderClass: "border-stone-300",
    textClass: "text-stone-700",
  },
  white: {
    label: "Liste Blanche",
    emoji: "🤍",
    bgClass: "bg-stone-50",
    borderClass: "border-stone-200",
    textClass: "text-stone-500",
  },
  red: {
    label: "Liste Rouge",
    emoji: "🔴",
    bgClass: "bg-kelen-red-50",
    borderClass: "border-kelen-red-500",
    textClass: "text-kelen-red-800",
  },
  black: {
    label: "Liste Noire",
    emoji: "⚫",
    bgClass: "bg-[#1A1A1A]",
    borderClass: "border-[#1A1A1A]",
    textClass: "text-white",
  },
} as const;

// Abonnement pricing
export const SUBSCRIPTION_MONTHLY_FCFA = 3000;
export const SUBSCRIPTION_MONTHLY_EUR = 15;

// Tier Features
export const TIER_FEATURES = {
  free: {
    label: "Version Gratuite",
    maxProjects: 3,
    isIndexable: false,
    hasVideo: false,
    price: 0,
  },
  premium: {
    label: "Abonnement Premium",
    maxProjects: Infinity,
    isIndexable: true,
    hasVideo: true,
    price: 3000,
  },
} as const;

// File upload constraints
export const FILE_LIMITS = {
  contract: { maxSize: 10 * 1024 * 1024, accept: ".pdf", maxFiles: 1 },
  evidencePhotos: { maxSize: 5 * 1024 * 1024, accept: ".jpg,.jpeg,.png", maxFiles: 10 },
  portfolioPhotos: { maxSize: 5 * 1024 * 1024, accept: ".jpg,.jpeg,.png", maxFiles: 20 },
  portfolioVideos: { maxSize: 50 * 1024 * 1024, accept: ".mp4", maxFiles: 5 },
  verificationDocs: { maxSize: 10 * 1024 * 1024, accept: ".pdf", maxFiles: 5 },
} as const;

// Navigation
export const MARKETING_NAV = [
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/pour-les-pros", label: "Pour les pros" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
] as const;

export const FOOTER_LINKS = {
  plateforme: [
    { href: "/recherche", label: "Rechercher" },
    { href: "/comment-ca-marche", label: "Comment ça marche" },
    { href: "/pour-les-pros", label: "Pour les pros" },
    { href: "/tarifs", label: "Tarifs" },
  ],
  legal: [
    { href: "/mentions-legales", label: "Mentions légales" },
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/cgu", label: "CGU" },
  ],
  contact: [
    { href: "mailto:verification@kelen.com", label: "verification@kelen.com" },
    { href: "mailto:support@kelen.com", label: "support@kelen.com" },
    { href: "/contact", label: "Formulaire de contact" },
  ],
} as const;
