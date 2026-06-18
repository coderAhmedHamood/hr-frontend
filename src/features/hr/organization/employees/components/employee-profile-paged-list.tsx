'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import {
  useListPagination,
  PaginatedListShell,
  type PaginationBarState,
} from '@/components/ui/paged-list';

type Props<T> = {
  items: T[];
  resetDeps?: React.DependencyList;
  empty?: React.ReactNode;
  renderItems: (pageItems: T[]) => React.ReactNode;
  serverPagination?: PaginationBarState;
  loading?: boolean;
  /** When true, fills the parent flex container instead of a fixed 80vh. */
  fillParent?: boolean;
  className?: string;
};

export function EmployeeProfilePagedList<T>({
  items,
  resetDeps,
  empty,
  renderItems,
  serverPagination,
  loading = false,
  fillParent = false,
  className,
}: Props<T>) {
  const clientPagination = useListPagination(items, serverPagination ? undefined : resetDeps);

  const page = serverPagination?.page ?? clientPagination.page;
  const pageSize = serverPagination?.pageSize ?? clientPagination.pageSize;
  const total = serverPagination?.total ?? clientPagination.total;
  const totalPages = serverPagination?.totalPages ?? clientPagination.totalPages;
  const setPage = serverPagination?.setPage ?? clientPagination.setPage;
  const setPageSize = serverPagination?.setPageSize ?? clientPagination.setPageSize;
  const pageItems = serverPagination ? items : clientPagination.pageItems;

  const pagination: PaginationBarState = {
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
  };

  return (
    <div
      className={cn(
        'flex w-full min-h-0 flex-col overflow-hidden',
        fillParent ? 'h-full min-h-0 flex-1' : 'h-[80vh]',
        className,
      )}
    >
      <PaginatedListShell pagination={pagination}>
        {loading && pageItems.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري التحميل…
          </div>
        ) : !loading && total === 0 && empty ? (
          <div className="flex flex-1 items-center justify-center py-10">{empty}</div>
        ) : (
          renderItems(pageItems)
        )}
      </PaginatedListShell>
    </div>
  );
}
