/**
 * Geocoding Utility
 * 
 * Uses Google Maps REST API to perform reverse geocoding on coordinates.
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export interface GeocodingResult {
  city: string;
  formattedAddress: string;
  country?: string;
}

/**
 * Reverse geocode coordinates to a human-readable address and city.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[Geocoding] No Google Maps API key found in environment');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=fr`;

  try {
    console.log('[Geocoding] Fetching:', { lat, lng });
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('[Geocoding] API Error:', data.status, data.error_message);
      return null;
    }

    const firstResult = data.results[0];
    const addressComponents = firstResult.address_components as any[];

    // Extract city name
    // 1. Locality (most cities)
    // 2. Administrative Area Level 2 (some African regions/cities)
    // 3. Sublocality
    const city = 
      addressComponents.find((c: any) => c.types.includes('locality'))?.long_name ||
      addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ||
      addressComponents.find((c: any) => c.types.includes('sublocality'))?.long_name ||
      addressComponents[0]?.long_name || 
      'Lieu inconnu';

    const country = addressComponents.find((c: any) => c.types.includes('country'))?.long_name;

    return {
      city,
      formattedAddress: firstResult.formatted_address,
      country
    };
  } catch (error) {
    console.error('[Geocoding] Fetch failed:', error);
    return null;
  }
}
