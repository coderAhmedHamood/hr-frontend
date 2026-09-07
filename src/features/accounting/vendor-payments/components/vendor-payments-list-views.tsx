'use client';

import * as React from 'react';
import { CreditCard } from 'lucide-react';
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
import type { VendorPayment } from '@/features/accounting/domain/types/vendor-payment';
import type { VendorPaymentsDirectoryModel } from '@/features/accounting/vendor-payments/hooks/useVendorPaymentsDirectoryModel';

export function VendorPaymentsListViews({ model }: { model: VendorPaymentsDirectoryModel }) {
  const { payments, view, router, deletePayment, resetDeps, t } = model;

  const columns = React.useCallback((requestDelete: (id: string) => void): ColumnDef<VendorPayment>[] => [
    { key: 'number', title: t.vendorPayments.number, render: (item) => <span dir="ltr" className="font-mono font-semibold text-primary">{item.name}</span> },
    { key: 'vendor', title: t.vendorPayments.vendor, render: (item) => item.partnerName },
    { key: 'status', title: t.vendorPayments.status, render: (item) => <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} /> },
    { key: 'amount', title: t.vendorPayments.amount, render: (item) => <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amount, item.currency)}</span> },
    { key: 'journal', title: t.vendorPayments.journal, render: (item) => item.journalName },
    { key: 'method', title: t.vendorPayments.method, className: 'text-muted-foreground', render: (item) => item.paymentMethodLine },
    { key: 'memo', title: t.vendorPayments.memo, className: 'text-muted-foreground', render: (item) => item.memo || '—' },
    { key: 'date', title: t.vendorPayments.date, render: (item) => <TableDateCell value={item.paymentDate} /> },
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
      items={payments}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.vendorPaymentDetail(item.id))}
      onDelete={deletePayment}
      emptyIcon={CreditCard}
      emptyTitle={t.common.noResults}
      deleteTitle={t.vendorPayments.deleteTitle}
      deleteDescription={t.vendorPayments.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="min-w-0">
              <DirectoryGridCardTitle dir="ltr">{item.name}</DirectoryGridCardTitle>
              <p className="truncate text-[11px] text-muted-foreground">{item.partnerName}</p>
            </div>
            <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} />
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.vendorPayments.date}</span>
              <TableDateCell value={item.paymentDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.vendorPayments.journal}</span>
              <span className="truncate">{item.journalName}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.vendorPayments.amount}</span>
              <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amount, item.currency)}</span>
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
