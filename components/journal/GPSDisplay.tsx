import { MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { getGPSDistanceStatus } from '@/lib/utils/gps-distance';

interface GPSDisplayProps {
  latitude: number;
  longitude: number;
  locationName?: string | null;
  source?: 'exif' | 'browser' | 'manual';
  projectLocationLat?: number | null;
  projectLocationLng?: number | null;
}

export default function GPSDisplay({ 
  latitude, 
  longitude, 
  locationName,
  source, 
  projectLocationLat, 
  projectLocationLng 
}: GPSDisplayProps) {
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
        <MapPin className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm text-on-surface">
          {locationName || 'Lieu non renseigné'}
        </span>
      </div>

      {source && (
        <p className="text-xs text-on-surface-variant/70">
          Source : {sourceLabels[source] || source} {source === 'exif' && '✅'}
        </p>
      )}

      {distanceInfo && (
        <div className={`flex items-center gap-2 text-xs ${distanceInfo.isClose ? 'text-green-600 font-medium' : 'text-amber-600'}`}>
          {distanceInfo.isClose ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span>
             Log pris à {distanceInfo.formatted} du projet
          </span>
        </div>
      )}
    </div>
  );
}
