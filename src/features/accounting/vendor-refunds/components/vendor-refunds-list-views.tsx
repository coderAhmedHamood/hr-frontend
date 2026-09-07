'use client';

import * as React from 'react';
import { Receipt } from 'lucide-react';
import {
  DirectoryGridCard,
  DirectoryGridCardHeader,
  DirectoryGridCardMeta,
  DirectoryGridCardMetaRow,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import { AccountingDirectoryCardActions } from '@/features/accounting/_shared/components/accounting-directory-card-actions';
import { AccountingDirectoryViews } from '@/features/accounting/_shared/components/accounting-directory-views';
import { AccountingStatusBadge } from '@/features/accounting/_shared/components/accounting-status-badge';
import { formatAccountingAmount } from '@/features/accounting/_shared/lib/format-accounting-amount';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import type { VendorRefund } from '@/features/accounting/domain/types/vendor-refund';
import type { VendorRefundsDirectoryModel } from '@/features/accounting/vendor-refunds/hooks/useVendorRefundsDirectoryModel';

export function VendorRefundsListViews({ model }: { model: VendorRefundsDirectoryModel }) {
  const { refunds, view, router, deleteRefund, resetDeps, t } = model;

  const columns = React.useCallback((requestDelete: (id: string) => void): ColumnDef<VendorRefund>[] => [
    { key: 'number', title: t.refunds.number, render: (item) => <span dir="ltr" className="font-mono font-semibold text-primary">{item.name}</span> },
    { key: 'vendor', title: t.refunds.vendor, render: (item) => item.vendorName },
    { key: 'original', title: t.refunds.originalBill, className: 'text-muted-foreground', render: (item) => <span dir="ltr" className="font-mono text-xs">{item.originalBillName || '—'}</span> },
    { key: 'status', title: t.refunds.documentStatus, render: (item) => <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} /> },
    { key: 'payment', title: t.refunds.paymentStatus, render: (item) => <AccountingStatusBadge status={item.paymentState} label={t.statuses[item.paymentState]} /> },
    { key: 'total', title: t.refunds.total, render: (item) => <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span> },
    { key: 'due', title: t.refunds.due, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountDue, item.currency)}</span> },
    { key: 'untaxed', title: t.refunds.untaxed, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountUntaxed, item.currency)}</span> },
    { key: 'date', title: t.refunds.date, render: (item) => <TableDateCell value={item.refundDate} /> },
    {
      key: 'actions',
      title: t.common.actions,
      isActions: true,
      headerClassName: 'text-start w-16',
      render: (item) => (
        <TableRowActions menuItems={[{
          label: t.common.delete,
          destructive: true,
          onClick: () => requestDelete(item.id),
        }]} />
      ),
    },
  ], [t]);

  return (
    <AccountingDirectoryViews
      items={refunds}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.vendorRefundDetail(item.id))}
      onDelete={deleteRefund}
      emptyIcon={Receipt}
      emptyTitle={t.common.noResults}
      deleteTitle={t.refunds.deleteTitle}
      deleteDescription={t.refunds.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="min-w-0">
              <DirectoryGridCardTitle dir="ltr">{item.name}</DirectoryGridCardTitle>
              <p className="truncate text-[11px] text-muted-foreground">{item.vendorName}</p>
            </div>
            <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} />
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.refunds.date}</span>
              <TableDateCell value={item.refundDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.refunds.originalBill}</span>
              <span dir="ltr" className="font-mono">{item.originalBillName || '—'}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.refunds.total}</span>
              <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.refunds.paymentStatus}</span>
              <AccountingStatusBadge status={item.paymentState} label={t.statuses[item.paymentState]} />
            </DirectoryGridCardMetaRow>
          </DirectoryGridCardMeta>
          <AccountingDirectoryCardActions
            onOpen={actions.open}
            onDelete={actions.requestDelete}
            openLabel={t.common.open}
            deleteLabel={t.common.delete}
          />
        </DirectoryGridCard>
      )}
    />
  );
}
