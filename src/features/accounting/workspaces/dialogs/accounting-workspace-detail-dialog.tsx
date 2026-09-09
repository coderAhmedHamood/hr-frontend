'use client';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TableDateCell } from '@/components/ui/table-cells';
import { AccountingStatusBadge } from '@/features/accounting/_shared/components/accounting-status-badge';
import { formatAccountingAmount } from '@/features/accounting/_shared/lib/format-accounting-amount';
import type { AccountingWorkspaceModel } from '@/features/accounting/workspaces/hooks/useAccountingWorkspaceModel';
import type { AccountingWorkspaceRow } from '@/features/accounting/workspaces/types/accounting-workspace';

interface Props {
  row: AccountingWorkspaceRow | null;
  onOpenChange: (open: boolean) => void;
  model: AccountingWorkspaceModel;
}

export function AccountingWorkspaceDetailDialog({ row, onOpenChange, model }: Props) {
  if (!row) return null;

  const fields = [
    [model.common.reference, <span key="reference" dir="ltr" className="font-mono">{row.reference}</span>],
    [model.common.account, row.account],
    [model.common.partner, row.partner],
    [model.common.category, row.category],
    [
      model.common.status,
      <AccountingStatusBadge
        key="status"
        status={row.status}
        label={model.statusLabels[row.status]}
      />,
    ],
    [model.common.date, <TableDateCell key="date" value={row.date} />],
    [
      model.common.debit,
      <span key="debit" dir="ltr" className="font-mono font-semibold">
        {formatAccountingAmount(row.debit, 'SAR')}
      </span>,
    ],
    [
      model.common.credit,
      <span key="credit" dir="ltr" className="font-mono font-semibold">
        {formatAccountingAmount(row.credit, 'SAR')}
      </span>,
    ],
    [
      model.common.balance,
      <span key="balance" dir="ltr" className="font-mono font-bold text-primary">
        {formatAccountingAmount(row.balance, 'SAR')}
      </span>,
    ],
  ] as const;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{model.common.details}</DialogTitle>
          <DialogDescription dir="ltr">{row.reference}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="mb-1 text-xs text-muted-foreground">{label}</p>
              <div className="text-sm font-medium text-foreground">{value}</div>
            </div>
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
