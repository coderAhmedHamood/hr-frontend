'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
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
import type { VendorBill } from '@/features/accounting/domain/types/vendor-bill';
import type { VendorBillsDirectoryModel } from '@/features/accounting/vendor-bills/hooks/useVendorBillsDirectoryModel';

export function VendorBillsListViews({ model }: { model: VendorBillsDirectoryModel }) {
  const { bills, view, router, deleteBill, resetDeps, t } = model;

  const columns = React.useCallback((requestDelete: (id: string) => void): ColumnDef<VendorBill>[] => [
    { key: 'number', title: t.bills.number, render: (item) => <span dir="ltr" className="font-mono font-semibold text-primary">{item.name}</span> },
    { key: 'vendor', title: t.bills.vendor, render: (item) => item.vendorName },
    { key: 'status', title: t.bills.documentStatus, render: (item) => <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} /> },
    { key: 'payment', title: t.bills.paymentStatus, render: (item) => <AccountingStatusBadge status={item.paymentState} label={t.statuses[item.paymentState]} /> },
    { key: 'total', title: t.bills.total, render: (item) => <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span> },
    { key: 'due', title: t.bills.due, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountDue, item.currency)}</span> },
    { key: 'untaxed', title: t.bills.untaxed, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountUntaxed, item.currency)}</span> },
    { key: 'date', title: t.bills.billDate, render: (item) => <TableDateCell value={item.billDate} /> },
    { key: 'due-date', title: t.bills.dueDate, render: (item) => <TableDateCell value={item.dueDate} /> },
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
      items={bills}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.vendorBillDetail(item.id))}
      onDelete={deleteBill}
      emptyIcon={FileText}
      emptyTitle={t.common.noResults}
      deleteTitle={t.bills.deleteTitle}
      deleteDescription={t.bills.deleteDescription}
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
              <span className="text-muted-foreground">{t.bills.billDate}</span>
              <TableDateCell value={item.billDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.bills.dueDate}</span>
              <TableDateCell value={item.dueDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.bills.total}</span>
              <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.bills.paymentStatus}</span>
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
