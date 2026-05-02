"use client";

import { useEffect, useState, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    // Skip loading if no API key provided
    if (!apiKey || apiKey.trim() === "") {
      return;
    }

    const loadScript = () => {
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
        setTimeout(() => clearInterval(checkInterval), 10000); // safety timeout
        return;
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
      
      script.onerror = (err) => {
        setHasError(true);
      };

      document.head.appendChild(script);
    };

    // Use IntersectionObserver to lazy load the script when the container enters the viewport
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting || entries[0].intersectionRatio > 0) {
        loadScript();
        observer.disconnect();
      }
    }, {
      // Load slightly before it enters the viewport (200px threshold)
      rootMargin: '200px'
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    } else {
      // Fallback
      loadScript();
    }

    return () => {
      observer.disconnect();
    };
  }, [apiKey]);

  if (hasError) {
    return (
      <div className="text-xs text-rose-600 p-2">
        Erreur de chargement de Google Maps
      </div>
    );
  }

  return (
    <div ref={containerRef} className="contents">
      {children}
    </div>
  );
}

