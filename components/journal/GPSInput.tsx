'use client';

import { useState, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useGPS } from '@/hooks/use-gps';

interface GPSInputProps {
  onGPSChange: (lat: number, lng: number, source: 'exif' | 'browser' | 'manual') => void;
  initialLat?: number;
  initialLng?: number;
  initialSource?: 'exif' | 'browser' | 'manual';
}

export default function GPSInput({ onGPSChange, initialLat, initialLng, initialSource }: GPSInputProps) {
  const { latitude, longitude, source, sourceLabel, isDetecting, error, detectLocation } = useGPS();
  const [latInput, setLatInput] = useState(initialLat?.toString() || '');
  const [lngInput, setLngInput] = useState(initialLng?.toString() || '');

  const handleDetect = useCallback(async () => {
    await detectLocation();
  }, [detectLocation]);

  // Sync GPS state to parent
  const handleManualSubmit = useCallback(() => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    onGPSChange(lat, lng, 'manual');
  }, [latInput, lngInput, onGPSChange]);

  // When GPS is detected, notify parent
  useState(() => {
    if (latitude && longitude && source) {
      onGPSChange(latitude, longitude, source);
    }
  });

  const displayLat = latitude?.toFixed(7) || '';
  const displayLng = longitude?.toFixed(7) || '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-on-surface flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Localisation GPS
        </label>
        <button
          type="button"
          onClick={handleDetect}
          disabled={isDetecting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
          aria-label="Détecter ma position"
        >
          {isDetecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MapPin className="w-3.5 h-3.5" />
          )}
          Détecter
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gps-lat" className="sr-only">Latitude</label>
          <input
            id="gps-lat"
            type="number"
            step="any"
            placeholder="Latitude"
            value={displayLat || latInput}
            onChange={(e) => {
              setLatInput(e.target.value);
              if (latitude && longitude) onGPSChange(parseFloat(e.target.value), longitude, 'manual');
            }}
            onBlur={handleManualSubmit}
            className="w-full px-3 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
            aria-label="Latitude GPS"
          />
        </div>
        <div>
          <label htmlFor="gps-lng" className="sr-only">Longitude</label>
          <input
            id="gps-lng"
            type="number"
            step="any"
            placeholder="Longitude"
            value={displayLng || lngInput}
            onChange={(e) => {
              setLngInput(e.target.value);
              if (latitude && longitude) onGPSChange(latitude, parseFloat(e.target.value), 'manual');
            }}
            onBlur={handleManualSubmit}
            className="w-full px-3 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40"
            aria-label="Longitude GPS"
          />
        </div>
      </div>

      {sourceLabel && (
        <p className="text-xs text-on-surface-variant">
          Source : {sourceLabel} {source === 'exif' && '✅'}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
