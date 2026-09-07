'use client';

import * as React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import {
  DirectoryGrid,
  DirectoryGridCard,
  DirectoryGridCardHeader,
  DirectoryGridCardMeta,
  DirectoryGridCardMetaRow,
  DirectoryGridCardTitle,
} from '@/components/ui/directory-grid-card';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { EmptyState } from '@/components/ui/shared-dialogs';
import { TableDateCell } from '@/components/ui/table-cells';
import { AccountingStatusBadge } from '@/features/accounting/_shared/components/accounting-status-badge';
import { formatAccountingAmount } from '@/features/accounting/_shared/lib/format-accounting-amount';
import type { AccountingWorkspaceModel } from '@/features/accounting/workspaces/hooks/useAccountingWorkspaceModel';
import type { AccountingWorkspaceRow } from '@/features/accounting/workspaces/types/accounting-workspace';

export function AccountingWorkspaceListViews({ model }: { model: AccountingWorkspaceModel }) {
  const columns = React.useMemo<ColumnDef<AccountingWorkspaceRow>[]>(() => [
    {
      key: 'reference',
      title: model.common.reference,
      render: (item) => (
        <span dir="ltr" className="font-mono font-semibold text-primary">{item.reference}</span>
      ),
    },
    { key: 'account', title: model.common.account, render: (item) => item.account },
    { key: 'partner', title: model.common.partner, render: (item) => item.partner },
    {
      key: 'status',
      title: model.common.status,
      render: (item) => (
        <AccountingStatusBadge status={item.status} label={model.statusLabels[item.status]} />
      ),
    },
    {
      key: 'debit',
      title: model.common.debit,
      render: (item) => (
        <span dir="ltr" className="font-mono">{formatAccountingAmount(item.debit, 'SAR')}</span>
      ),
    },
    {
      key: 'credit',
      title: model.common.credit,
      render: (item) => (
        <span dir="ltr" className="font-mono">{formatAccountingAmount(item.credit, 'SAR')}</span>
      ),
    },
    {
      key: 'balance',
      title: model.common.balance,
      render: (item) => (
        <span dir="ltr" className="font-mono font-semibold">
          {formatAccountingAmount(item.balance, 'SAR')}
        </span>
      ),
    },
    { key: 'date', title: model.common.date, render: (item) => <TableDateCell value={item.date} /> },
  ], [model.common, model.statusLabels]);

  if (model.rows.length === 0) {
    return <EmptyState icon={FileSpreadsheet} title={model.directoryCommon.noResults} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 animate-fade-in">
      <DirectoryPagedViews items={model.rows} resetDeps={model.resetDeps}>
        {(pageItems) =>
          model.view === 'table' ? (
            <DataTable
              variant="directory"
              alwaysShowTable
              columns={columns}
              data={pageItems}
              keyExtractor={(item) => item.id}
              onRowClick={(item) => model.setSelectedRow(item)}
            />
          ) : (
            <DirectoryGrid>
              {pageItems.map((item) => (
                <DirectoryGridCard
                  key={item.id}
                  interactive
                  onClick={() => model.setSelectedRow(item)}
                >
                  <DirectoryGridCardHeader>
                    <div className="min-w-0">
                      <DirectoryGridCardTitle dir="ltr">{item.reference}</DirectoryGridCardTitle>
                      <p className="truncate text-[11px] text-muted-foreground">{item.account}</p>
                    </div>
                    <AccountingStatusBadge
                      status={item.status}
                      label={model.statusLabels[item.status]}
                    />
                  </DirectoryGridCardHeader>
                  <DirectoryGridCardMeta>
                    <DirectoryGridCardMetaRow>
                      <span className="text-muted-foreground">{model.common.partner}</span>
                      <span className="truncate">{item.partner}</span>
                    </DirectoryGridCardMetaRow>
                    <DirectoryGridCardMetaRow>
                      <span className="text-muted-foreground">{model.common.date}</span>
                      <TableDateCell value={item.date} />
                    </DirectoryGridCardMetaRow>
                    <DirectoryGridCardMetaRow>
                      <span className="text-muted-foreground">{model.common.balance}</span>
                      <span dir="ltr" className="font-mono font-semibold">
                        {formatAccountingAmount(item.balance, 'SAR')}
                      </span>
                    </DirectoryGridCardMetaRow>
                  </DirectoryGridCardMeta>
                </DirectoryGridCard>
              ))}
            </DirectoryGrid>
          )
        }
      </DirectoryPagedViews>
    </div>
  );
}
