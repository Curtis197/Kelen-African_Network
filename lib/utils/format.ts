// ============================================
// Kelen — Formatting Utilities
// ============================================

const frDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const frShortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const frRelativeFormatter = new Intl.RelativeTimeFormat("fr-FR", {
  numeric: "auto",
});

/**
 * Format a date string to French long format
 * e.g. "12 janvier 2025"
 */
export function formatDate(dateString: string): string {
  return frDateFormatter.format(new Date(dateString));
}

/**
 * Format a date string to French short format
 * e.g. "12 janv. 2025"
 */
export function formatShortDate(dateString: string): string {
  return frShortDateFormatter.format(new Date(dateString));
}

/**
 * Format a relative time (e.g. "il y a 2 jours")
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return frRelativeFormatter.format(diffMinutes, "minute");
    }
    return frRelativeFormatter.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return frRelativeFormatter.format(diffDays, "day");
  }
  if (Math.abs(diffDays) < 365) {
    return frRelativeFormatter.format(Math.round(diffDays / 30), "month");
  }
  return frRelativeFormatter.format(Math.round(diffDays / 365), "year");
}

/**
 * Format EUR currency
 * e.g. "47,50 €"
 */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Format large numbers with French separators
 * e.g. "1 247"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("fr-FR").format(num);
}

/**
 * Format a rating to one decimal
 * e.g. "4.7"
 */
export function formatRating(rating: number | null): string {
  if (rating === null) return "—";
  return rating.toFixed(1);
}

/**
 * Estimate remaining views from balance
 */
export function estimateViews(balance: number): number {
  return Math.floor(balance / 0.005);
}

/**
 * Format a percentage
 * e.g. "91,5%"
 */
export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Get country name from ISO code
 */
export function getCountryName(code: string): string {
  try {
    const name = new Intl.DisplayNames(["fr"], { type: "region" }).of(code);
    return name || code;
  } catch {
    return code;
  }
}

/**
 * Calculate tenure string from creation date
 * e.g. "3 ans 8 mois"
 */
export function formatTenure(createdAt: string): string {
  const start = new Date(createdAt);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  const totalMonths = years * 12 + months;

  if (totalMonths < 1) return "Moins d'un mois";
  if (totalMonths < 12) return `${totalMonths} mois`;

  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (m === 0) return `${y} an${y > 1 ? "s" : ""}`;
  return `${y} an${y > 1 ? "s" : ""} ${m} mois`;
}
