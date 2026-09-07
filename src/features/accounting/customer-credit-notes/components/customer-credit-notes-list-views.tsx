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
import type { CustomerCreditNote } from '@/features/accounting/domain/types/customer-credit-note';
import type { CustomerCreditNotesDirectoryModel } from '@/features/accounting/customer-credit-notes/hooks/useCustomerCreditNotesDirectoryModel';

export function CustomerCreditNotesListViews({ model }: { model: CustomerCreditNotesDirectoryModel }) {
  const { creditNotes, view, router, deleteCreditNote, resetDeps, t } = model;

  const columns = React.useCallback((requestDelete: (id: string) => void): ColumnDef<CustomerCreditNote>[] => [
    { key: 'number', title: t.creditNotes.number, render: (item) => <span dir="ltr" className="font-mono font-semibold text-primary">{item.name}</span> },
    { key: 'customer', title: t.creditNotes.customer, render: (item) => item.customerName },
    { key: 'original', title: t.creditNotes.originalInvoice, className: 'text-muted-foreground', render: (item) => <span dir="ltr" className="font-mono text-xs">{item.originalInvoiceName || '—'}</span> },
    { key: 'status', title: t.creditNotes.documentStatus, render: (item) => <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} /> },
    { key: 'payment', title: t.creditNotes.paymentStatus, render: (item) => <AccountingStatusBadge status={item.paymentState} label={t.statuses[item.paymentState]} /> },
    { key: 'total', title: t.creditNotes.total, render: (item) => <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span> },
    { key: 'due', title: t.creditNotes.due, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountDue, item.currency)}</span> },
    { key: 'untaxed', title: t.creditNotes.untaxed, render: (item) => <span dir="ltr" className="font-mono">{formatAccountingAmount(item.amountUntaxed, item.currency)}</span> },
    { key: 'date', title: t.creditNotes.date, render: (item) => <TableDateCell value={item.creditNoteDate} /> },
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
      items={creditNotes}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.customerCreditNoteDetail(item.id))}
      onDelete={deleteCreditNote}
      emptyIcon={Receipt}
      emptyTitle={t.common.noResults}
      deleteTitle={t.creditNotes.deleteTitle}
      deleteDescription={t.creditNotes.deleteDescription}
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
              <span className="text-muted-foreground">{t.creditNotes.date}</span>
              <TableDateCell value={item.creditNoteDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.creditNotes.originalInvoice}</span>
              <span dir="ltr" className="font-mono">{item.originalInvoiceName || '—'}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.creditNotes.total}</span>
              <span dir="ltr" className="font-mono font-semibold">{formatAccountingAmount(item.amountTotal, item.currency)}</span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.creditNotes.paymentStatus}</span>
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
