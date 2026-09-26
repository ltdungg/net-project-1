import { Badge } from '@/components/ui/badge';
import { statusLabel } from '@/lib/admin-data';
import { cn } from '@/lib/utils';

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const tone = ['delivered', 'paid', 'active', 'fulfilled'].includes(status)
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : ['cancelled', 'returned', 'failed', 'disabled'].includes(status)
      ? 'bg-red-50 text-red-700 ring-red-200'
      : ['pending_payment', 'pending', 'scheduled', 'ready_to_ship'].includes(status)
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-sky-50 text-sky-700 ring-sky-200';
  return (
    <Badge variant="secondary" className={cn('ring-1', tone)}>
      {label ?? statusLabel(status)}
    </Badge>
  );
}
