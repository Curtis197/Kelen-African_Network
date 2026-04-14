"use client";

import { useEffect, useState } from "react";

// Add Google Maps type declaration
declare global {
  interface Window {
    google?: typeof google;
  }
}

interface GoogleMapsScriptProps {
  apiKey: string;
  children: React.ReactNode;
}

export function GoogleMapsScriptProvider({ apiKey, children }: GoogleMapsScriptProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Skip loading if no API key provided
    if (!apiKey || apiKey.trim() === "") {
      console.warn('[GoogleMapsScript] No API key provided, skipping Google Maps loading');
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Prevent duplicate script loads
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Script already exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load the Google Maps script with async loading pattern
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    // Create global init callback
    (window as any).initGoogleMaps = () => {
      setTimeout(() => {
        if (window.google?.maps) {
          setIsLoaded(true);
        }
      }, 100);
    };
    
    script.onerror = () => setHasError(true);

    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup
    };
  }, [apiKey]);

  if (hasError) {
    return (
      <div className="text-xs text-rose-600 p-2">
        Erreur de chargement de Google Maps
      </div>
    );
  }

  return <>{children}</>;
}
