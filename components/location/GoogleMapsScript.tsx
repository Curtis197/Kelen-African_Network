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
    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Load the Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setHasError(true);

    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup, it should stay loaded
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
