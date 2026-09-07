import { Badge } from '@/components/ui/badge';

const STATUS_VARIANTS = {
  draft: 'subtle',
  posted: 'success',
  cancel: 'destructive',
  in_process: 'gold',
  not_paid: 'warning',
  in_payment: 'secondary',
  paid: 'success',
  partial: 'gold',
  reversed: 'destructive',
} as const;

export function AccountingStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const variant = STATUS_VARIANTS[status as keyof typeof STATUS_VARIANTS] ?? 'subtle';
  return <Badge variant={variant}>{label}</Badge>;
}
