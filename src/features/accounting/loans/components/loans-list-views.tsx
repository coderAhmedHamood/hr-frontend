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
import type { Loan } from '@/features/accounting/domain/types/loan';
import type { LoansDirectoryModel } from '@/features/accounting/loans/hooks/useLoansDirectoryModel';

export function LoansListViews({ model }: { model: LoansDirectoryModel }) {
  const { loans, view, router, deleteLoan, resetDeps, t } = model;

  const columns = React.useCallback(
    (requestDelete: (id: string) => void): ColumnDef<Loan>[] => [
      {
        key: 'name',
        title: t.loans.name,
        render: (item) => (
          <span className="font-semibold text-foreground">
            {item.name}
          </span>
        ),
      },
      {
        key: 'startDate',
        title: t.loans.startDate,
        render: (item) => <TableDateCell value={item.loanDate} />,
      },
      {
        key: 'endDate',
        title: t.loans.endDate,
        render: (item) => <TableDateCell value={item.endDate || item.loanDate} />,
      },
      {
        key: 'borrowedAmount',
        title: t.loans.borrowedAmount,
        render: (item) => (
          <span dir="ltr" className="font-mono font-semibold">
            {formatAccountingAmount(item.borrowedAmount, 'SAR')}
          </span>
        ),
      },
      {
        key: 'dueAmount',
        title: t.loans.dueAmount,
        render: (item) => (
          <span dir="ltr" className="font-mono font-semibold">
            {formatAccountingAmount(item.dueAmount, 'SAR')}
          </span>
        ),
      },
      {
        key: 'status',
        title: t.loans.documentStatus,
        render: (item) => (
          <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} />
        ),
      },
      {
        key: 'actions',
        title: t.common.actions,
        isActions: true,
        headerClassName: 'text-start w-16',
        render: (item) => (
          <TableRowActions
            menuItems={[
              {
                label: t.common.delete,
                destructive: true,
                onClick: () => requestDelete(item.id),
              },
            ]}
          />
        ),
      },
    ],
    [t],
  );

  return (
    <AccountingDirectoryViews
      items={loans}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.loanDetail(item.id))}
      onDelete={deleteLoan}
      emptyIcon={CreditCard}
      emptyTitle={t.common.noResults}
      deleteTitle={t.loans.deleteTitle}
      deleteDescription={t.loans.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="min-w-0">
              <DirectoryGridCardTitle>{item.name}</DirectoryGridCardTitle>
              <p className="truncate text-[11px] text-muted-foreground">{item.journalName}</p>
            </div>
            <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} />
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.loans.startDate}</span>
              <TableDateCell value={item.loanDate} />
            </DirectoryGridCardMetaRow>
            {item.endDate && (
              <DirectoryGridCardMetaRow>
                <span className="text-muted-foreground">{t.loans.endDate}</span>
                <TableDateCell value={item.endDate} />
              </DirectoryGridCardMetaRow>
            )}
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.loans.borrowedAmount}</span>
              <span dir="ltr" className="font-mono font-semibold">
                {formatAccountingAmount(item.borrowedAmount, 'SAR')}
              </span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.loans.dueAmount}</span>
              <span dir="ltr" className="font-mono font-semibold">
                {formatAccountingAmount(item.dueAmount, 'SAR')}
              </span>
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
