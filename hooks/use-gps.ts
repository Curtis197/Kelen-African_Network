import { useState, useCallback } from 'react';
import { saveLastGPS, getLastGPS } from '@/lib/utils/daily-log-drafts';

interface GPSState {
  latitude: number | null;
  longitude: number | null;
  source: 'exif' | 'browser' | 'manual' | null;
  sourceLabel: string;
  isDetecting: boolean;
  error: string | null;
}

export function useGPS() {
  const [state, setState] = useState<GPSState>({
    latitude: null,
    longitude: null,
    source: null,
    sourceLabel: '',
    isDetecting: false,
    error: null,
  });

  const detectLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isDetecting: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('La géolocalisation n\'est pas supportée'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Cache GPS
      await saveLastGPS(lat, lng);

      setState({
        latitude: lat,
        longitude: lng,
        source: 'browser',
        sourceLabel: 'Position détectée (appareil)',
        isDetecting: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de détection';
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: message,
      }));
    }
  }, []);

  const setManualGPS = useCallback((lat: number, lng: number) => {
    saveLastGPS(lat, lng);
    setState({
      latitude: lat,
      longitude: lng,
      source: 'manual',
      sourceLabel: 'Manuelle',
      isDetecting: false,
      error: null,
    });
  }, []);

  const setEXIFGPS = useCallback(async (lat: number, lng: number) => {
    await saveLastGPS(lat, lng);
    setState({
      latitude: lat,
      longitude: lng,
      source: 'exif',
      sourceLabel: 'EXIF (photo)',
      isDetecting: false,
      error: null,
    });
  }, []);

  const loadCachedGPS = useCallback(async () => {
    const cached = await getLastGPS();
    if (cached) {
      setState({
        latitude: cached.latitude,
        longitude: cached.longitude,
        source: 'browser',
        sourceLabel: 'Dernière position connue',
        isDetecting: false,
        error: null,
      });
    }
  }, []);

  const clearGPS = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      source: null,
      sourceLabel: '',
      isDetecting: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    detectLocation,
    setManualGPS: setManualGPS,
    setEXIFGPS,
    loadCachedGPS,
    clearGPS,
  };
}
