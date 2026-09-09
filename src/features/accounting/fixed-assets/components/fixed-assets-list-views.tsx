'use client';

import * as React from 'react';
import { Layers } from 'lucide-react';
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
import type { FixedAsset } from '@/features/accounting/domain/types/fixed-asset';
import type { FixedAssetsDirectoryModel } from '@/features/accounting/fixed-assets/hooks/useFixedAssetsDirectoryModel';

export function FixedAssetsListViews({ model }: { model: FixedAssetsDirectoryModel }) {
  const { assets, view, router, deleteAsset, resetDeps, t } = model;

  const columns = React.useCallback(
    (requestDelete: (id: string) => void): ColumnDef<FixedAsset>[] => [
      {
        key: 'name',
        title: t.fixedAssets.name,
        render: (item) => (
          <span className="font-semibold text-foreground">
            {item.name}
          </span>
        ),
      },
      {
        key: 'acquisitionDate',
        title: t.fixedAssets.acquisitionDate,
        render: (item) => <TableDateCell value={item.acquisitionDate} />,
      },
      {
        key: 'originalValue',
        title: t.fixedAssets.originalValue,
        render: (item) => (
          <span dir="ltr" className="font-mono font-semibold">
            {formatAccountingAmount(item.originalValue, 'SAR')}
          </span>
        ),
      },
      {
        key: 'method',
        title: t.fixedAssets.method,
        render: (item) => item.method,
      },
      {
        key: 'bookValue',
        title: t.fixedAssets.bookValue,
        render: (item) => (
          <span dir="ltr" className="font-mono font-semibold">
            {formatAccountingAmount(item.bookValue, 'SAR')}
          </span>
        ),
      },
      {
        key: 'depreciableValue',
        title: t.fixedAssets.depreciableValue,
        render: (item) => (
          <span dir="ltr" className="font-mono">
            {formatAccountingAmount(item.depreciableValue, 'SAR')}
          </span>
        ),
      },
      {
        key: 'fixedAssetAccount',
        title: t.fixedAssets.fixedAssetAccount,
        render: (item) => (
          <span className="text-xs text-muted-foreground">{item.fixedAssetAccount}</span>
        ),
      },
      {
        key: 'depreciationAccount',
        title: t.fixedAssets.depreciationAccount,
        render: (item) => (
          <span className="text-xs text-muted-foreground">{item.depreciationAccount}</span>
        ),
      },
      {
        key: 'expenseAccount',
        title: t.fixedAssets.expenseAccount,
        render: (item) => (
          <span className="text-xs text-muted-foreground">{item.expenseAccount}</span>
        ),
      },
      {
        key: 'status',
        title: t.fixedAssets.documentStatus,
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
      items={assets}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.fixedAssetDetail(item.id))}
      onDelete={deleteAsset}
      emptyIcon={Layers}
      emptyTitle={t.common.noResults}
      deleteTitle={t.fixedAssets.deleteTitle}
      deleteDescription={t.fixedAssets.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="min-w-0">
              <DirectoryGridCardTitle>{item.name}</DirectoryGridCardTitle>
              <p className="truncate text-[11px] text-muted-foreground">{item.method}</p>
            </div>
            <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} />
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.fixedAssets.acquisitionDate}</span>
              <TableDateCell value={item.acquisitionDate} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.fixedAssets.originalValue}</span>
              <span dir="ltr" className="font-mono font-semibold">
                {formatAccountingAmount(item.originalValue, 'SAR')}
              </span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.fixedAssets.bookValue}</span>
              <span dir="ltr" className="font-mono font-semibold">
                {formatAccountingAmount(item.bookValue, 'SAR')}
              </span>
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.fixedAssets.depreciableValue}</span>
              <span dir="ltr" className="font-mono">
                {formatAccountingAmount(item.depreciableValue, 'SAR')}
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
