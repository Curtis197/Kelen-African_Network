"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/utils/register-sw";

/**
 * Registers the service worker on first mount.
 * Runs once per session (guarded by navigator.serviceWorker.controller).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
