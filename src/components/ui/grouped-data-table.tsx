'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronsDownUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DataTableHead,
  TableTotalsRow,
  type ColumnDef,
} from '@/components/ui/data-table';
import type { ListSortState } from '@/components/ui/list-sort';
import {
  listGroupValue,
  type GroupedListModel,
  type ListGroupModel,
} from '@/components/ui/list-group';
import { cn } from '@/shared/utils';

type GroupedDataTableProps<T> = {
  columns: ColumnDef<T>[];
  /** The grouping chosen by the user (field, group order, labels). */
  group: ListGroupModel;
  /** The groups and the rows of the open groups (`useGroupedList`). */
  list: GroupedListModel<T>;
  keyExtractor(row: T): string;
  onRowClick?(row: T): void;
  /** Order of the rows inside each group (the list's own sort). */
  sort?: ListSortState;
  onSort?(key: string): void;
  emptyText?: string;
  className?: string;
};

/**
 * A list grouped by one field: a heading per group (its name, row count and
 * each column's subtotal), which opens to show the group's rows a page at a
 * time, and a grand total under all groups. Counts and totals cover every
 * filtered row; rows inside a group follow the list's sort order.
 */
export function GroupedDataTable<T>({
  columns,
  group,
  list,
  keyExtractor,
  onRowClick,
  sort,
  onSort,
  emptyText = 'لا توجد بيانات',
  className,
}: GroupedDataTableProps<T>) {
  const groups = React.useMemo(
    () => group.sortGroups(list.summary?.groups ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the order is in `group.group`
    [list.summary, group.group],
  );

  if (list.loading && !list.summary) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  const allOpen = groups.every((g) => list.expanded.has(listGroupValue(g.key)));

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col rounded-xl border border-border bg-card shadow-soft', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-xs text-muted-foreground">
        <span>
          {groups.length.toLocaleString('en-US')} مجموعة حسب «{group.option?.label}» ·{' '}
          {(list.summary?.total.count ?? 0).toLocaleString('en-US')} سجل (كل السجلات المطابقة للفلاتر)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={allOpen ? list.collapseAll : list.expandAll}
        >
          {allOpen ? <ChevronsDownUp className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5" />}
          {allOpen ? 'طيّ الكل' : 'فتح الكل'}
        </Button>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <DataTableHead columns={columns} sort={sort} onSort={onSort} />
          {groups.map((g) => {
            const value = listGroupValue(g.key);
            const open = list.expanded.has(value);
            const state = list.rows[value];
            const label = group.labelOf(g);
            return (
              <tbody key={value} className="divide-y divide-border/40 border-b border-border">
                <tr
                  className="cursor-pointer bg-muted/40 font-semibold hover:bg-muted/60"
                  onClick={() => list.toggle(value)}
                  aria-expanded={open}
                >
                  {columns.map((col, i) => (
                    <td key={col.key} className={cn('px-4 py-2.5', i > 0 && col.className)}>
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          {open ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span>{label}</span>
                          <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                            {g.count.toLocaleString('en-US')}
                          </span>
                        </span>
                      ) : col.total ? col.total(g) : null}
                    </td>
                  ))}
                </tr>
                {open && state ? (
                  <>
                    {state.items.map((row, ri) => (
                      <tr
                        key={keyExtractor(row)}
                        className={cn('group transition-colors hover:bg-muted/20', onRowClick && 'cursor-pointer')}
                        onClick={() => onRowClick?.(row)}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={cn('px-4 py-3', col.isActions && 'text-start w-28', col.className)}
                            onClick={col.isActions || col.isInteractive ? (e) => e.stopPropagation() : undefined}
                          >
                            {col.isActions ? (
                              <div className="flex justify-end gap-1">{col.render(row, ri)}</div>
                            ) : (
                              <div>{col.render(row, ri)}</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {state.loading || state.items.length < state.total ? (
                      <tr>
                        <td colSpan={columns.length} className="px-4 py-2 text-center">
                          {state.loading ? (
                            <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => list.loadMore(value)}
                            >
                              عرض المزيد ({state.items.length.toLocaleString('en-US')} من{' '}
                              {state.total.toLocaleString('en-US')})
                            </Button>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </>
                ) : null}
              </tbody>
            );
          })}
          {list.summary && columns.some((c) => c.total) ? (
            <tfoot>
              <TableTotalsRow columns={columns} totals={list.summary.total} />
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
