'use client';

import * as React from 'react';
import { DirectoryGrid } from '@/components/ui/directory-grid-card';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { ConfirmationModal, EmptyState } from '@/components/ui/shared-dialogs';
import type { AccountingDirectoryView } from '@/features/accounting/_shared/hooks/use-accounting-directory-chrome';

type CardActions = {
  open: () => void;
  requestDelete: () => void;
};

type Props<T> = {
  items: T[];
  view: AccountingDirectoryView;
  columns: (requestDelete: (id: string) => void) => ColumnDef<T>[];
  getId: (item: T) => string;
  onOpen: (item: T) => void;
  onDelete: (id: string) => void;
  renderCard: (item: T, actions: CardActions) => React.ReactNode;
  emptyIcon: React.ElementType;
  emptyTitle: string;
  deleteTitle: string;
  deleteDescription: string;
  deleteConfirmLabel: string;
  resetDeps?: React.DependencyList;
};

export function AccountingDirectoryViews<T>({
  items,
  view,
  columns,
  getId,
  onOpen,
  onDelete,
  renderCard,
  emptyIcon,
  emptyTitle,
  deleteTitle,
  deleteDescription,
  deleteConfirmLabel,
  resetDeps,
}: Props<T>) {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const resolvedColumns = React.useMemo(
    () => columns(setDeleteId),
    [columns],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 animate-fade-in">
      <ConfirmationModal
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel={deleteConfirmLabel}
        variant="destructive"
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
          setDeleteId(null);
        }}
      />

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} />
      ) : (
        <DirectoryPagedViews items={items} resetDeps={resetDeps}>
          {(pageItems) =>
            view === 'table' ? (
              <DataTable
                variant="directory"
                alwaysShowTable
                columns={resolvedColumns}
                data={pageItems}
                keyExtractor={getId}
                onRowClick={onOpen}
              />
            ) : (
              <DirectoryGrid>
                {pageItems.map((item) => {
                  const id = getId(item);
                  return (
                    <React.Fragment key={id}>
                      {renderCard(item, {
                        open: () => onOpen(item),
                        requestDelete: () => setDeleteId(id),
                      })}
                    </React.Fragment>
                  );
                })}
              </DirectoryGrid>
            )
          }
        </DirectoryPagedViews>
      )}
    </div>
  );
}
