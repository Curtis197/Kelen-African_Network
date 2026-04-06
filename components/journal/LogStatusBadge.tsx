import { type LogStatus } from '@/lib/types/daily-logs';

interface LogStatusBadgeProps {
  status: LogStatus;
}

const statusConfig: Record<LogStatus, { label: string; className: string; darkClassName: string }> = {
  pending: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-800',
    darkClassName: 'bg-amber-200/20 text-amber-300',
  },
  approved: {
    label: 'Approuvé',
    className: 'bg-green-100 text-green-800',
    darkClassName: 'bg-green-200/20 text-green-300',
  },
  contested: {
    label: 'Contesté',
    className: 'bg-red-100 text-red-800',
    darkClassName: 'bg-red-200/20 text-red-300',
  },
  resolved: {
    label: 'Résolu',
    className: 'bg-blue-100 text-blue-800',
    darkClassName: 'bg-blue-200/20 text-blue-300',
  },
};

export default function LogStatusBadge({ status }: LogStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${config.className} dark:${config.darkClassName}`}
      role="status"
      aria-label={config.label}
    >
      {config.label}
    </span>
  );
}
