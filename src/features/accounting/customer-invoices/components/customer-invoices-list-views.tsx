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
import type { CustomerInvoice } from '@/features/accounting/domain/types/customer-invoice';
import type { CustomerInvoicesDirectoryModel } from '@/features/accounting/customer-invoices/hooks/useCustomerInvoicesDirectoryModel';

export function CustomerInvoicesListViews({ model }: { model: CustomerInvoicesDirectoryModel }) {
  const { invoices, view, router, deleteInvoice, resetDeps, t } = model;

  const columns = React.useCallback((requestDelete: (id: string) => void): ColumnDef<CustomerInvoice>[] => [
    { key: 'number', title: t.invoices.number, render: (item) => <span dir="ltr" className="font-mono font-semibold text-primary">{item.name}</span> },
    { key: 'customer', title: t.invoices.customer, render: (item) => item.customerName },
    { key: 'status', title: t.invoices.documentStatus, render: (item) => <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} /> },
    { key: 'payment', title: t.invoices.paymentStatus, render: (item) => <AccountingStatusBadge status={item.paymentState} label={t.statuses[item.paymentState]} /> },
    { key: 'total', title: t.invoices.total, render: (item) => <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span> },
    { key: 'due', title: t.invoices.due, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountDue, item.currency)}</span> },
    { key: 'untaxed', title: t.invoices.untaxed, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountUntaxed, item.currency)}</span> },
    { key: 'date', title: t.invoices.invoiceDate, render: (item) => <TableDateCell value={item.invoiceDate} /> },
    { key: 'due-date', title: t.invoices.dueDate, render: (item) => <TableDateCell value={item.dueDate} /> },
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
      items={invoices}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.customerInvoiceDetail(item.id))}
      onDelete={deleteInvoice}
      emptyIcon={FileText}
      emptyTitle={t.common.noResults}
      deleteTitle={t.invoices.deleteTitle}
      deleteDescription={t.invoices.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="min-w-0">
              <DirectoryGridCardTitle dir="ltr">{item.name}</DirectoryGridCardTitle>
              <p className="truncate text-[11px] text-muted-foreground">{item.customerName}</p>
            </div>
            <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} />
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.invoices.invoiceDate}</span>
              <TableDateCell value={item.invoiceDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.invoices.dueDate}</span>
              <TableDateCell value={item.dueDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.invoices.total}</span>
              <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.invoices.paymentStatus}</span>
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
