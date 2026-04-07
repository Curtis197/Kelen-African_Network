interface PriceDisplayProps {
  amount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  className?: string;
}

export default function PriceDisplay({ amount, currency, className = '' }: PriceDisplayProps) {
  const formatPrice = (amount: number, currency: string): string => {
    if (currency === 'XOF') {
      // Format as "2 500 000 FCFA" or "2.5M FCFA" for large amounts
      if (amount >= 1000000) {
        const millions = amount / 1000000;
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M FCFA`;
      }
      if (amount >= 1000) {
        const thousands = amount / 1000;
        return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K FCFA`;
      }
      return `${amount.toLocaleString('fr-FR')} FCFA`;
    }
    
    if (currency === 'EUR') {
      return `${amount.toLocaleString('fr-FR')} €`;
    }
    
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US')}`;
    }
    
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <span className={`font-bold text-kelen-green-600 ${className}`}>
      {formatPrice(amount, currency)}
    </span>
  );
}
