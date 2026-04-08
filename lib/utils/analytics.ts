/**
 * Client-side analytics tracking utility.
 * Sends events to GA4 (if available) and logs for debugging.
 */

interface TrackEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
}

export function trackEvent({ action, category, label, value, ...rest }: TrackEvent): void {
  if (typeof window === "undefined") return;

  // Send to GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
      ...rest,
    });
  }
}

/**
 * Track profile view — fires when a professional profile is loaded.
 */
export function trackProfileView(slug: string, profession: string, location?: string): void {
  trackEvent({
    action: "profile_view",
    category: "engagement",
    label: `${slug} — ${profession}`,
    profession,
    location,
    slug,
  });
}

/**
 * Track contact interaction — phone, email, or WhatsApp click.
 */
export function trackContactClick(method: "phone" | "email" | "whatsapp", slug: string): void {
  trackEvent({
    action: "contact_click",
    category: "conversion",
    label: `${method} — ${slug}`,
    method,
    slug,
  });
}

/**
 * Track search appearance — when a pro is found via directory search.
 */
export function trackSearchAppearance(slug: string, query: string): void {
  trackEvent({
    action: "search_appearance",
    category: "discovery",
    label: query,
    slug,
    search_query: query,
  });
}

// Type augmentation for gtag
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
    dataLayer: unknown[];
  }
}
