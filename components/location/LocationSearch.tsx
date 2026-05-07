"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, MapPin, X, Navigation } from "lucide-react";

export interface LocationData {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
}

interface LocationSearchProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  className?: string;
}

export function LocationSearch({ value, onChange, placeholder = "Rechercher une ville ou un lieu...", className = "" }: LocationSearchProps) {
  const [inputValue, setInputValue] = useState(value?.formatted_address || "");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  // Poll for Google Maps availability
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsGoogleLoaded(true);
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
      return;
    }

    // Poll every 200ms until Google is loaded
    checkInterval.current = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsGoogleLoaded(true);
        autocompleteService.current = new google.maps.places.AutocompleteService();
        const dummyDiv = document.createElement("div");
        placesService.current = new google.maps.places.PlacesService(dummyDiv);
        if (checkInterval.current) clearInterval(checkInterval.current);
      }
    }, 200);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, []);

  // Update input when value changes externally
  useEffect(() => {
    if (value?.city) {
      // Show city name instead of full address
      setInputValue(value.city);
    } else {
      setInputValue("");
    }
  }, [value]);

  // Extract city name from address components
  const extractCityName = (addressComponents: google.maps.GeocoderAddressComponent[]): string => {
    // Try locality first (most cities)
    const locality = addressComponents.find(c => c.types.includes("locality"));
    if (locality) return locality.long_name;
    
    // Try administrative_area_level_2 (some regions)
    const area2 = addressComponents.find(c => c.types.includes("administrative_area_level_2"));
    if (area2) return area2.long_name;
    
    // Try sublocality (neighborhoods/districts)
    const sublocality = addressComponents.find(c => c.types.includes("sublocality"));
    if (sublocality) return sublocality.long_name;
    
    // Fallback to first component
    return addressComponents[0]?.long_name || "Position actuelle";
  };

  // Fetch place details when a suggestion is selected
  const fetchPlaceDetails = useCallback((placeId: string) => {
    if (!placesService.current) {
      setError("Service Google Maps non disponible");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);

    placesService.current.getDetails(
      { placeId, fields: ["name", "formatted_address", "geometry", "address_components"] },
      (place, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const country = place.address_components?.find(c => c.types.includes("country"));
          const city = place.address_components?.find(c => c.types.includes("locality"));
          
          const locationData: LocationData = {
            name: city?.long_name || place.name || "",
            formatted_address: place.formatted_address || "",
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            country: country?.long_name,
            city: city?.long_name,
          };
          
          onChange(locationData);
          // Show only city name in the input
          setInputValue(city?.long_name || place.name || "");
        } else {
          setError("Impossible de récupérer les détails du lieu");
        }
      }
    );
  }, [onChange]);

  // Handle input change with debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    setError(null);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      onChange(null);
      return;
    }

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (!isGoogleLoaded || !autocompleteService.current) {
        // Silently skip — Google Maps still loading, poll will catch it
        return;
      }

      if (query.length >= 2) {
        setIsLoading(true);
        autocompleteService.current!.getPlacePredictions(
          {
            input: query,
            types: ["(cities)"],
          },
          (predictions, status) => {
            setIsLoading(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
      }
    }, 300);
  }, [isGoogleLoaded, onChange]);

  // Get user's current location
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Use Geocoder to get address from coordinates
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };

        geocoder.geocode({ location: latlng }, (results, status) => {
          setIsGettingLocation(false);

          if (status === "OK" && results && results[0]) {
            const result = results[0];
            const addressComponents = result.address_components || [];
            const cityName = extractCityName(addressComponents);
            const country = addressComponents.find(c => c.types.includes("country"));

            const locationData: LocationData = {
              name: cityName,
              formatted_address: result.formatted_address,
              lat: latitude,
              lng: longitude,
              country: country?.long_name,
              city: cityName,
            };

            onChange(locationData);
            // Show only city name in the input
            setInputValue(cityName);
          } else {
            setError("Impossible de déterminer votre position");
          }
        });
      },
      (err) => {
        setError("Impossible d'accéder à votre position. Vérifiez les permissions.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  // Clear selection
  const handleClear = useCallback(() => {
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
    setError(null);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (suggestions.length > 0 && inputValue.length >= 2) {
      setShowSuggestions(true);
    }
  }, [suggestions.length, inputValue.length]);

  // Handle input blur (close suggestions)
  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isGoogleLoaded ? placeholder : `${placeholder} (saisie manuelle)`}
          className="w-full bg-stone-50 border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-10 sm:pl-12 pr-20 text-sm sm:text-base text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
          autoComplete="off"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-stone-100 overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => fetchPlaceDetails(suggestion.place_id)}
              className="w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors flex items-start gap-3 border-b border-stone-50 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {suggestion.structured_formatting?.main_text || suggestion.description}
                </p>
                <p className="text-xs text-stone-500 truncate">
                  {suggestion.structured_formatting?.secondary_text || ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-stone-100 p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-kelen-green-600 animate-spin mr-2" />
          <span className="text-sm text-stone-500">Recherche en cours...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 text-xs text-rose-600 font-medium">
          {error}
        </div>
      )}

      {/* Google Maps not loaded warning */}
      {!isGoogleLoaded && (
        <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>Saisie manuelle uniquement - Google Maps non disponible</span>
        </div>
      )}
    </div>
  );
}
