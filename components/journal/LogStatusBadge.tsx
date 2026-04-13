import { type LogStatus } from '@/lib/types/daily-logs';

interface LogStatusBadgeProps {
  status: LogStatus;
}

const statusConfig: Record<LogStatus, { label: string; className: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-800',
  },
  approved: {
    label: 'Approuvé',
    className: 'bg-green-100 text-green-800',
  },
  contested: {
    label: 'Contesté',
    className: 'bg-red-100 text-red-800',
  },
  resolved: {
    label: 'Résolu',
    className: 'bg-blue-100 text-blue-800',
  },
};

export default function LogStatusBadge({ status }: LogStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${config.className}`}
      role="status"
      aria-label={config.label}
    >
      {config.label}
    </span>
  );
}
