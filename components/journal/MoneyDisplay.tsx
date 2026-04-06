interface MoneyDisplayProps {
  amount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  compact?: boolean;
}

export default function MoneyDisplay({ amount, currency, compact = false }: MoneyDisplayProps) {
  const formatCurrency = (value: number, curr: string): string => {
    if (compact && value >= 1000000) {
      if (curr === 'XOF') {
        return `${(value / 1000000).toFixed(1)}M ${curr}`;
      }
      if (curr === 'EUR') {
        return `${(value / 1000).toFixed(1)}k ${curr}`;
      }
    }

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <span className="font-semibold text-on-surface" aria-label={`${amount} ${currency}`}>
      💰 {formatCurrency(amount, currency)}
    </span>
  );
}
