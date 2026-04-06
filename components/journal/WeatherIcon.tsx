import { type WeatherCondition } from '@/lib/types/daily-logs';

const weatherConfig: Record<WeatherCondition, { emoji: string; label: string }> = {
  sunny: { emoji: '☀️', label: 'Ensoleillé' },
  cloudy: { emoji: '⛅', label: 'Nuageux' },
  rainy: { emoji: '🌧️', label: 'Pluvieux' },
  stormy: { emoji: '⛈️', label: 'Orageux' },
  cold: { emoji: '❄️', label: 'Froid' },
};

interface WeatherIconProps {
  weather: WeatherCondition;
  showLabel?: boolean;
}

export default function WeatherIcon({ weather, showLabel = false }: WeatherIconProps) {
  const config = weatherConfig[weather];

  if (showLabel) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-lg">{config.emoji}</span>
        <span className="text-sm text-on-surface-variant">{config.label}</span>
      </span>
    );
  }

  return (
    <span className="text-lg" title={config.label} role="img" aria-label={config.label}>
      {config.emoji}
    </span>
  );
}
