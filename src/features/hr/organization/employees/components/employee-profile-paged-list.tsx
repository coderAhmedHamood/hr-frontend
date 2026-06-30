'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useListPagination, type PaginationBarState } from '@/components/ui/paged-list';
import { StickyPagination } from '@/components/ui/sticky-pagination';

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
 * Paginated list for employee profile sections — content flows in the main page
 * scroll (no nested viewport). Pagination sticks to the bottom while scrolling.
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

  const page = serverPagination?.page ?? clientPagination.page;
  const pageSize = serverPagination?.pageSize ?? clientPagination.pageSize;
  const total = serverPagination?.total ?? clientPagination.total;
  const totalPages = serverPagination?.totalPages ?? clientPagination.totalPages;
  const setPage = serverPagination?.setPage ?? clientPagination.setPage;
  const setPageSize = serverPagination?.setPageSize ?? clientPagination.setPageSize;
  const pageItems = serverPagination ? items : clientPagination.pageItems;

  if (loading && pageItems.length === 0) {
    return (
      <div className={cn('flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري التحميل…
      </div>
    );
  }

  if (!loading && total === 0 && empty) {
    return <div className={cn('flex items-center justify-center py-10', className)}>{empty}</div>;
  }

  return (
    <div className={cn('flex w-full min-w-0 flex-col', className)}>
      <div className="min-w-0">{renderItems(pageItems)}</div>
      {total > 0 ? (
        <div className="sticky bottom-2 z-10 mt-4 flex justify-center bg-gradient-to-t from-muted/30 via-background/90 to-transparent px-2 pb-1 pt-4">
          <StickyPagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : null}
    </div>
  );
}
