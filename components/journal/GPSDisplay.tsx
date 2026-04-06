import { MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { getGPSDistanceStatus } from '@/lib/utils/gps-distance';

interface GPSDisplayProps {
  latitude: number;
  longitude: number;
  source?: 'exif' | 'browser' | 'manual';
  projectLocationLat?: number | null;
  projectLocationLng?: number | null;
}

export default function GPSDisplay({ latitude, longitude, source, projectLocationLat, projectLocationLng }: GPSDisplayProps) {
  const sourceLabels: Record<string, string> = {
    exif: 'EXIF (photo)',
    browser: 'Position détectée (appareil)',
    manual: 'Manuelle',
  };

  const distanceInfo = getGPSDistanceStatus(
    latitude,
    longitude,
    projectLocationLat || null,
    projectLocationLng || null
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <MapPin className="w-4 h-4" />
        <span className="font-mono text-xs">
          {latitude.toFixed(7)}°N, {longitude.toFixed(7)}°W
        </span>
      </div>

      {source && (
        <p className="text-xs text-on-surface-variant/70">
          Source : {sourceLabels[source] || source} {source === 'exif' && '✅'}
        </p>
      )}

      {distanceInfo && (
        <div className={`flex items-center gap-2 text-xs ${distanceInfo.isClose ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {distanceInfo.isClose ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span>
            {distanceInfo.isClose ? '✓' : '⚠'} {distanceInfo.formatted} du lieu du projet
          </span>
        </div>
      )}
    </div>
  );
}
