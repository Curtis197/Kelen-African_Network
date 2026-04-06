/**
 * Calculate distance between two GPS coordinates using Haversine formula.
 * Returns distance in meters.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance in meters to human-readable string.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get GPS status info comparing log location to project location.
 */
export function getGPSDistanceStatus(
  logLat: number,
  logLng: number,
  projectLat: number | null,
  projectLng: number | null
): { distance: number; formatted: string; isClose: boolean } | null {
  if (!projectLat || !projectLng) return null;

  const distance = calculateDistance(logLat, logLng, projectLat, projectLng);
  return {
    distance,
    formatted: formatDistance(distance),
    isClose: distance <= 50, // Within 50m is considered "at project location"
  };
}
