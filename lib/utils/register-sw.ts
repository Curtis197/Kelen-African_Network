/**
 * Register the Kelen service worker.
 * Call once on app mount (e.g. in root layout or Navbar).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[SW] Service worker registered:", registration.scope);
    }

    return registration;
  } catch (err) {
    console.error("[SW] Registration failed:", err);
    return null;
  }
}
