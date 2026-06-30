'use client';

import * as React from 'react';
import { type ReactNode, useLayoutEffect, useRef } from 'react';
import { usePageHeaderFilterRegion } from '@/components/layouts/page-header-actions-context';
import { StickyPagination, DEFAULT_PAGE_SIZE } from '@/components/ui/sticky-pagination';
import { cn } from '@/shared/utils';

export { DEFAULT_PAGE_SIZE, DISCIPLINE_PAGE_SIZE_OPTIONS as PAGE_SIZE_OPTIONS } from '@/components/ui/sticky-pagination';

export interface PaginationBarState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export function useListPagination<T>(
  items: T[],
  resetDeps?: React.DependencyList,
  defaultPageSize = DEFAULT_PAGE_SIZE,
) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  React.useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit filter reset keys from callers
  }, [total, pageSize, ...(resetDeps ?? [])]);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = React.useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const setPageClamped = React.useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), totalPages)),
    [totalPages],
  );

  const setPageSizeReset = React.useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    page,
    setPage: setPageClamped,
    pageSize,
    setPageSize: setPageSizeReset,
    pageItems,
    total,
    totalPages,
  };
}

function useViewportFillHeight<T extends HTMLElement>(bottomGap = 16) {
  const ref = useRef<T>(null);
  const { filterPanelOpen } = usePageHeaderFilterRegion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const top = el.getBoundingClientRect().top;
      const height = Math.max(160, window.innerHeight - top - bottomGap);
      el.style.height = `${height}px`;
    };

    sync();
    const raf = requestAnimationFrame(sync);

    const ro = new ResizeObserver(sync);
    ro.observe(document.documentElement);

    let node: HTMLElement | null = el.parentElement;
    while (node) {
      ro.observe(node);
      node = node.parentElement;
    }

    window.addEventListener('resize', sync);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [bottomGap, filterPanelOpen]);

  return ref;
}

/** List region sized to the viewport; pagination stays at the bottom. */
export function PagedListViewport({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useViewportFillHeight<HTMLDivElement>(16);

  return (
    <div ref={ref} className={cn('flex min-h-0 flex-col overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface PagedShellProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function PagedShell({ children, footer, className }: PagedShellProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-hidden', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer ? <div className="shrink-0 pt-0">{footer}</div> : null}
    </div>
  );
}

export interface PaginationBarState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

interface PaginatedListShellProps {
  pagination: PaginationBarState;
  children: ReactNode;
}

export function PaginatedListShell({ pagination, children }: PaginatedListShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <PagedShell
        footer={
          <StickyPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        }
      >
        {children}
      </PagedShell>
    </div>
  );
}

interface DirectoryPagedViewsProps<T> {
  items: T[];
  resetDeps?: React.DependencyList;
  empty?: ReactNode;
  children: (pageItems: T[]) => ReactNode;
  /** When set, `items` are already a server page — no client slicing. */
  serverPagination?: PaginationBarState;
  loading?: boolean;
}

/** Paginated directory list — single page scroll (no nested viewport). */
export function DirectoryPagedViews<T>({
  items,
  resetDeps,
  empty,
  children,
  serverPagination,
  loading,
}: DirectoryPagedViewsProps<T>) {
  const clientPagination = useListPagination(items, resetDeps);

  if (serverPagination) {
    if (!loading && items.length === 0 && serverPagination.total === 0 && empty) {
      return <>{empty}</>;
    }

    const { page, pageSize, total, totalPages, setPage, setPageSize } = serverPagination;

    if (loading && items.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>
      );
    }

    return (
      <div className="flex w-full min-w-0 flex-1 flex-col">
        <div className="min-w-0">{children(items)}</div>
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

  const pagination = clientPagination;

  if (items.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col">
      <div className="min-w-0">{children(pagination.pageItems)}</div>
      {pagination.total > 0 ? (
        <div className="sticky bottom-2 z-10 mt-4 flex justify-center bg-gradient-to-t from-muted/30 via-background/90 to-transparent px-2 pb-1 pt-4">
          <StickyPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      ) : null}
    </div>
  );
}

export interface UseServerDirectoryPaginationOptions<T> {
  enabled?: boolean;
  defaultPageSize?: number;
  resetDeps?: React.DependencyList;
  /** When true, loads full dataset (via `loadBulk` or paged loop) and paginates in memory. */
  bulkMode?: boolean;
  loadBulk?: () => Promise<{ items: T[]; total: number }>;
}

/** Server-paginated list state; refetches when `page` / `pageSize` change (unless `bulkMode`). */
export function useServerDirectoryPagination<T>(
  loadPage: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  options?: UseServerDirectoryPaginationOptions<T>,
) {
  const enabled = options?.enabled ?? true;
  const defaultPageSize = options?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const bulkMode = options?.bulkMode ?? false;

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [items, setItems] = React.useState<T[]>([]);
  const [bulkItems, setBulkItems] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const resetKey = JSON.stringify(options?.resetDeps ?? []);

  const loadPageRef = useRef(loadPage);
  const loadBulkRef = useRef(options?.loadBulk);
  loadPageRef.current = loadPage;
  loadBulkRef.current = options?.loadBulk;

  const reloadBulk = React.useCallback(async () => {
    const loadBulkFn = loadBulkRef.current;
    if (!enabled || !bulkMode || !loadBulkFn) return;
    setLoading(true);
    try {
      const res = await loadBulkFn();
      setBulkItems(res.items);
      setTotal(res.total);
    } catch {
      setBulkItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [bulkMode, enabled]);

  const reloadPage = React.useCallback(async () => {
    if (!enabled || bulkMode) return;
    setLoading(true);
    try {
      const res = await loadPageRef.current(page, pageSize);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [bulkMode, enabled, page, pageSize]);

  React.useEffect(() => {
    if (bulkMode) void reloadBulk();
  }, [bulkMode, reloadBulk, resetKey]);

  React.useEffect(() => {
    if (!bulkMode) void reloadPage();
  }, [bulkMode, reloadPage, resetKey]);

  React.useEffect(() => {
    if (!enabled) {
      setItems([]);
      setBulkItems([]);
      setTotal(0);
      setLoading(false);
    }
  }, [enabled]);

  React.useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetKey encodes resetDeps
  }, [pageSize, resetKey, bulkMode]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setPageClamped = React.useCallback(
    (next: number) => setPage(Math.min(Math.max(1, next), totalPages)),
    [totalPages],
  );

  const setPageSizeReset = React.useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const pageItems = React.useMemo(() => {
    if (bulkMode) {
      return bulkItems.slice((page - 1) * pageSize, page * pageSize);
    }
    return items;
  }, [bulkItems, bulkMode, items, page, pageSize]);

  const pagination: PaginationBarState = {
    page,
    pageSize,
    total,
    totalPages,
    setPage: setPageClamped,
    setPageSize: setPageSizeReset,
  };

  const reload = React.useCallback(async () => {
    if (bulkMode) await reloadBulk();
    else await reloadPage();
  }, [bulkMode, reloadBulk, reloadPage]);

  return {
    items: pageItems,
    total,
    loading,
    page,
    pageSize,
    setPage: setPageClamped,
    setPageSize: setPageSizeReset,
    pagination,
    reload,
  };
}

interface ServerPaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
}

/** Sticky footer for server-paginated tables. */
export function ServerPaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}: ServerPaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  return (
    <StickyPagination
      page={page}
      pageSize={pageSize}
      total={total}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={pageSizeOptions}
    />
  );
}
