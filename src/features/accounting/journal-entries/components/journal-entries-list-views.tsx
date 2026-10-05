'use client';

import * as React from 'react';
import { ListOrdered } from 'lucide-react';
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
import type { JournalEntry } from '@/features/accounting/domain/types/journal-entry';
import type { JournalEntriesDirectoryModel } from '@/features/accounting/journal-entries/hooks/useJournalEntriesDirectoryModel';

export function JournalEntriesListViews({ model }: { model: JournalEntriesDirectoryModel }) {
  const { entries, view, router, deleteEntry, resetDeps, t } = model;

  const columns = React.useCallback(
    (requestDelete: (id: string) => void): ColumnDef<JournalEntry>[] => [
      {
        key: 'date',
        title: t.journalEntries.date,
        render: (item) => <TableDateCell value={item.date} />,
      },
      {
        key: 'number',
        title: t.journalEntries.number,
        render: (item) => (
          <span dir="ltr" className="font-mono font-semibold text-primary">
            {item.name}
          </span>
        ),
      },
      {
        key: 'partner',
        title: t.journalEntries.partner,
        render: (item) => item.partnerName || '—',
      },
      {
        key: 'reference',
        title: t.journalEntries.reference,
        render: (item) => (
          <span dir="ltr" className="font-mono text-xs text-muted-foreground">
            {item.reference || '—'}
          </span>
        ),
      },
      {
        key: 'journal',
        title: t.journalEntries.journal,
        render: (item) => item.journalName,
      },
      {
        key: 'total',
        title: t.journalEntries.total,
        render: (item) => (
          <span dir="ltr" className="font-mono font-semibold">
            {formatAccountingAmount(item.total, 'SAR')}
          </span>
        ),
      },
      {
        key: 'status',
        title: t.journalEntries.documentStatus,
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
      items={entries}
      view={view}
      columns={columns}
      getId={(item) => item.id}
      onOpen={(item) => router.push(accountingRoutes.journalEntryDetail(item.id))}
      onDelete={deleteEntry}
      emptyIcon={ListOrdered}
      emptyTitle={t.common.noResults}
      deleteTitle={t.journalEntries.deleteTitle}
      deleteDescription={t.journalEntries.deleteDescription}
      deleteConfirmLabel={t.common.delete}
      resetDeps={resetDeps}
      renderCard={(item, actions) => (
        <DirectoryGridCard interactive onClick={actions.open}>
          <DirectoryGridCardHeader>
            <div className="min-w-0">
              <DirectoryGridCardTitle dir="ltr">{item.name}</DirectoryGridCardTitle>
              <p className="truncate text-[11px] text-muted-foreground">{item.journalName}</p>
            </div>
            <AccountingStatusBadge status={item.state} label={t.statuses[item.state]} />
          </DirectoryGridCardHeader>
          <DirectoryGridCardMeta>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.journalEntries.date}</span>
              <TableDateCell value={item.date} />
            </DirectoryGridCardMetaRow>
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.journalEntries.partner}</span>
              <span className="truncate">{item.partnerName || '—'}</span>
            </DirectoryGridCardMetaRow>
            {item.reference && (
              <DirectoryGridCardMetaRow>
                <span className="text-muted-foreground">{t.journalEntries.reference}</span>
                <span dir="ltr" className="font-mono text-xs">{item.reference}</span>
              </DirectoryGridCardMetaRow>
            )}
            <DirectoryGridCardMetaRow>
              <span className="text-muted-foreground">{t.journalEntries.total}</span>
              <span dir="ltr" className="font-mono font-semibold">
                {formatAccountingAmount(item.total, 'SAR')}
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
