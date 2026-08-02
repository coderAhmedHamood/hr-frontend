'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import {
  PaginatedListShell,
  PagedListViewport,
  useListPagination,
  type PaginationBarState,
} from '@/components/ui/paged-list';

type Props<T> = {
  items: T[];
  resetDeps?: React.DependencyList;
  empty?: React.ReactNode;
  renderItems: (pageItems: T[]) => React.ReactNode;
  serverPagination?: PaginationBarState;
  loading?: boolean;
  className?: string;
};

/**
 * Paginated list for employee profile sections — same shell as directory pages.
 */
export function EmployeeProfilePagedList<T>({
  items,
  resetDeps,
  empty,
  renderItems,
  serverPagination,
  loading = false,
  className,
}: Props<T>) {
  const clientPagination = useListPagination(items, serverPagination ? undefined : resetDeps);

  const pagination: PaginationBarState = serverPagination ?? {
    page: clientPagination.page,
    pageSize: clientPagination.pageSize,
    total: clientPagination.total,
    totalPages: clientPagination.totalPages,
    setPage: clientPagination.setPage,
    setPageSize: clientPagination.setPageSize,
  };
  const pageItems = serverPagination ? items : clientPagination.pageItems;

  if (loading && pageItems.length === 0) {
    return (
      <div className={cn('flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري التحميل…
      </div>
    );
  }

  if (!loading && pagination.total === 0 && empty) {
    return <div className={cn('flex items-center justify-center py-10', className)}>{empty}</div>;
  }

  return (
    <PagedListViewport className={cn('w-full min-w-0 flex-1', className)} bottomGap={0}>
      <PaginatedListShell pagination={pagination}>
        {renderItems(pageItems)}
      </PaginatedListShell>
    </PagedListViewport>
  );
}
