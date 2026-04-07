"use client";

import { useState, useRef, useEffect } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (it requires a DOM element)
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
    }
  }, []);

  // Update input when value changes externally
  useEffect(() => {
    if (value?.formatted_address) {
      setInputValue(value.formatted_address);
    } else {
      setInputValue("");
    }
  }, [value]);

  // Fetch place details when a suggestion is selected
  const fetchPlaceDetails = async (placeId: string) => {
    if (!placesService.current) return;

    setIsLoading(true);
    setError(null);

    try {
      placesService.current.getDetails({ placeId, fields: ["name", "formatted_address", "geometry", "address_components"] }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData: LocationData = {
            name: place.name || "",
            formatted_address: place.formatted_address || "",
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            country: place.address_components?.find(c => c.types.includes("country"))?.long_name,
            city: place.address_components?.find(c => c.types.includes("locality"))?.long_name,
          };
          onChange(locationData);
          setInputValue(place.formatted_address || "");
        } else {
          setError("Impossible de récupérer les détails du lieu");
        }
        setIsLoading(false);
        setShowSuggestions(false);
      });
    } catch (err) {
      console.error("Error fetching place details:", err);
      setError("Erreur lors de la récupération des données");
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (autocompleteService.current && query.length >= 2) {
        setIsLoading(true);
        autocompleteService.current.getPlacePredictions(
          {
            input: query,
            types: ["(cities)"], // Prioritize cities, but can be expanded
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
  };

  // Get user's current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding to get address from coordinates
        if (placesService.current) {
          placesService.current.getDetails(
            { placeId: "ChIJd8BlQ2BZwokRAFUEcm_qrcA" }, // Dummy, we'll use geocoder instead
            (place, status) => {
              // Fallback to creating location data from coords
              const locationData: LocationData = {
                name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                formatted_address: `Position GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
                lat: latitude,
                lng: longitude,
              };
              onChange(locationData);
              setInputValue(locationData.formatted_address);
              setIsGettingLocation(false);
            }
          );
        }
        
        // Better approach: use Geocoder
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: latitude, lng: longitude };
        
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const result = results[0];
            const locationData: LocationData = {
              name: result.formatted_address.split(",")[0],
              formatted_address: result.formatted_address,
              lat: latitude,
              lng: longitude,
              country: result.address_components?.find(c => c.types.includes("country"))?.long_name,
              city: result.address_components?.find(c => c.types.includes("locality"))?.long_name,
            };
            onChange(locationData);
            setInputValue(result.formatted_address);
          } else {
            // Fallback to raw coordinates
            const locationData: LocationData = {
              name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              formatted_address: `Position GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              lat: latitude,
              lng: longitude,
            };
            onChange(locationData);
            setInputValue(locationData.formatted_address);
          }
          setIsGettingLocation(false);
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Impossible d'accéder à votre position. Vérifiez les permissions.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Clear selection
  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
    setError(null);
    inputRef.current?.focus();
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0 && inputValue.length >= 2) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (close suggestions)
  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <MapPin className="w-5 h-5 text-stone-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-stone-50 border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-12 pr-24 text-sm sm:text-base text-stone-900 focus:ring-2 focus:ring-kelen-green-500 transition-all font-medium"
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
          
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50"
            title="Utiliser ma position actuelle"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 text-kelen-green-600 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-stone-400" />
            )}
          </button>
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

      {/* Selected location indicator */}
      {value && value.lat && value.lng && (
        <div className="mt-2 text-xs text-kelen-green-600 font-medium flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>📍 {value.lat.toFixed(4)}, {value.lng.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
}
