"use strict";

/**
 * Kelen Service Worker
 * Caches app shell for offline access.
 * Handles background sync for offline log drafts.
 */

const CACHE_NAME = "kelen-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  // Note: /offline route not yet implemented - add when available
];

// ── Install: cache static assets ─────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker, caching static assets");
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Add assets one by one to avoid cache.addAll failing on single asset
      for (const asset of STATIC_ASSETS) {
        try {
          console.log("[SW] Caching:", asset);
          await cache.add(asset);
        } catch (err) {
          console.warn("[SW] Failed to cache asset:", asset, err.message);
        }
      }
      console.log("[SW] Install complete");
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first, fallback to cache ──────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET requests
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Background Sync ─────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-log-drafts") {
    event.waitUntil(syncDrafts());
  }
});

async function syncDrafts() {
  // This would read from IndexedDB and call the server action API
  // For now, the client-side handleSync does the heavy lifting.
  // Background sync is a future enhancement for true offline resilience.
}
