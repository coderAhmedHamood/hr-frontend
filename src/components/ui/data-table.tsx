'use client';

import * as React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';

/* ── Column definition ───────────────────────────────────────────────── */
export interface ColumnDef<T> {
  key: string;
  title: string;
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
  isActions?: boolean;
  /** Prevent row click when interacting with cell content (dropdowns, inputs). */
  isInteractive?: boolean;
  render(row: T, index: number): React.ReactNode;
}

/* ── DataTable ───────────────────────────────────────────────────────── */
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor(row: T): string;
  loading?: boolean;
  emptyText?: string;
  mobileCard?(row: T): React.ReactNode;
  onRowClick?(row: T): void;
  className?: string;
  /** Match legacy DirectoryTable styling (organization / discipline list views). */
  variant?: 'default' | 'directory';
  tableClassName?: string;
  /** Always render the table (horizontal scroll on small screens) instead of mobile cards. */
  alwaysShowTable?: boolean;
}

export function DataTable<T>({
  columns, data, keyExtractor, loading, emptyText = 'لا توجد بيانات',
  mobileCard, onRowClick, className, variant = 'default',
  tableClassName, alwaysShowTable = false,
}: DataTableProps<T>) {
  const isDirectory = variant === 'directory';

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  const headerRowClass = isDirectory
    ? 'border-b border-border text-xs font-semibold text-muted-foreground'
    : 'border-b border-border/60';

  const headerCellClass = isDirectory
    ? 'sticky top-0 z-10 bg-muted px-4 py-3 text-start border-b border-border'
    : 'sticky top-0 z-10 bg-card px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground/70 border-b border-border';

  const bodyRowClass = isDirectory
    ? cn('border-b border-border/60', onRowClick && 'group cursor-pointer hover:bg-muted/25')
    : cn('group transition-colors hover:bg-muted/20', onRowClick && 'cursor-pointer');

  const tableShell = (
    <div className={cn(alwaysShowTable ? 'min-w-0' : 'hidden min-w-0 md:block')}>
      <table className={cn('w-full text-sm', tableClassName)}>
        <thead className="isolate">
          <tr className={headerRowClass}>
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(headerCellClass, col.headerClassName)}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isDirectory ? undefined : 'divide-y divide-border/40'}>
          {data.map((row, i) => (
            <tr
              key={keyExtractor(row)}
              className={bodyRowClass}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3',
                    col.isActions && 'text-start w-28',
                    col.className,
                  )}
                  onClick={col.isActions || col.isInteractive ? (e) => e.stopPropagation() : undefined}
                >
                  {col.isActions ? (
                    <div className="flex justify-end gap-1">{col.render(row, i)}</div>
                  ) : (
                    <div>{col.render(row, i)}</div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={cn('min-w-0 rounded-xl border border-border bg-card shadow-soft', className)}>
      {tableShell}

      {!alwaysShowTable && (
        <div className="divide-y divide-border/40 md:hidden">
          {data.map((row, i) => (
            <div key={keyExtractor(row)} className="p-4">
              {mobileCard ? mobileCard(row) : (
                <div className="space-y-2">
                  {columns.filter(c => !c.hideOnMobile && !c.isActions).map(col => (
                    <div key={col.key} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide shrink-0">
                        {col.title}
                      </span>
                      <div className="text-sm">{col.render(row, i)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────── */
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange(page: number): void;
  onPageSizeChange?(size: number): void;
  pageSizeOptions?: number[];
}

export function AppPagination({
  page, pageSize, total, onPageChange, onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  const pages = React.useMemo(() => {
    const arr: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
    } else {
      arr.push(1);
      if (page > 3) arr.push('…');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i);
      if (page < totalPages - 2) arr.push('…');
      arr.push(totalPages);
    }
    return arr;
  }, [page, totalPages]);

  if (totalPages <= 1 && !onPageSizeChange) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3">
      <p className="text-[12px] text-muted-foreground number-ar">
        {start}–{end} من {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="icon"
              className={cn('h-8 w-8 rounded-lg text-sm', p === page && 'bg-primary text-primary-foreground')}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline" size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {onPageSizeChange && (
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground outline-none"
        >
          {pageSizeOptions.map(s => (
            <option key={s} value={s}>{s} / صفحة</option>
          ))}
        </select>
      )}
    </div>
  );
}

/* ── usePagination hook ──────────────────────────────────────────────── */
export function usePagination<T>(data: T[], pageSize = 20) {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(pageSize);
  const total = data.length;
  const slice = data.slice((page - 1) * size, page * size);
  const setPageSize = (s: number) => { setSize(s); setPage(1); };
  // reset to page 1 when data length changes
  React.useEffect(() => { setPage(1); }, [total]);
  return { page, setPage, pageSize: size, setPageSize, slice, total };
}
