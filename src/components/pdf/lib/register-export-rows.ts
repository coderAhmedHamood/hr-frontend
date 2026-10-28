import type { RegisterColumn, RegisterRow } from '@/components/pdf/print/register-document';
import { listGroupValue, type ListGroupSummary, type ListTotals } from '@/components/ui/list-group';

/** A printed / Excel column of a list: its cell for a row, and its total (when it has one). */
export type RegisterExportColumn<T> = RegisterColumn & {
  /** The screen column it mirrors (`ColumnDef.key`): hidden there, left out here. */
  key?: string;
  value: (row: T) => string;
  /** The column's total over a group / every row (from the list's `/groups`). */
  total?: (totals: ListTotals) => string;
};

type RegisterExportRowsParams<T> = {
  columns: RegisterExportColumn<T>[];
  /** Every filtered row, in the list's order. */
  rows: T[];
  /** Totals over every filtered row; adds a «الإجمالي» row when a column has a total. */
  total?: ListTotals | null;
  /** When the list is grouped: its groups in the screen's order. */
  grouping?: {
    /** «الموظف», «الفرع»… */
    fieldLabel: string;
    groups: ListGroupSummary[];
    labelOf: (group: ListGroupSummary) => string;
    /** The row's group key (`groupKey` of a list fetched with `groupBy`). */
    groupKeyOf: (row: T) => string | null | undefined;
  };
};

function totalsRow<T>(
  columns: RegisterExportColumn<T>[],
  totals: ListTotals,
  kind: 'subtotal' | 'total',
): RegisterRow {
  const label = kind === 'total' ? 'الإجمالي' : 'المجموع';
  return {
    kind,
    cells: columns.map((c, i) =>
      i === 0 ? `${label} (${totals.count.toLocaleString('en-US')})` : c.total?.(totals) ?? ''),
  };
}

/** The export columns whose screen column is visible (or that mirror none). */
export function visibleExportColumns<T>(
  columns: RegisterExportColumn<T>[],
  isVisible: (key: string) => boolean,
): RegisterExportColumn<T>[] {
  return columns.filter((c) => !c.key || isVisible(c.key));
}

/**
 * The register's rows as the screen shows them: the records, or — when the
 * list is grouped — each group's heading, its records and its subtotal, then
 * the grand total. Used by the PDF and the Excel export alike.
 */
export function registerExportRows<T>({
  columns,
  rows,
  total,
  grouping,
}: RegisterExportRowsParams<T>): RegisterRow[] {
  const hasTotals = columns.some((c) => c.total);
  const cells = (row: T) => columns.map((c) => c.value(row));

  if (!grouping) {
    const out: RegisterRow[] = rows.map(cells);
    if (total && hasTotals && rows.length > 0) out.push(totalsRow(columns, total, 'total'));
    return out;
  }

  const byGroup = new Map<string, T[]>();
  rows.forEach((row) => {
    const value = listGroupValue(grouping.groupKeyOf(row) ?? null);
    const list = byGroup.get(value);
    if (list) list.push(row);
    else byGroup.set(value, [row]);
  });

  const out: RegisterRow[] = [];
  const placed = new Set<string>();
  grouping.groups.forEach((g) => {
    const value = listGroupValue(g.key);
    const groupRows = byGroup.get(value) ?? [];
    placed.add(value);
    out.push({
      kind: 'group',
      title: `${grouping.fieldLabel}: ${grouping.labelOf(g)} — ${g.count.toLocaleString('en-US')} سجل`,
    });
    groupRows.forEach((row) => out.push(cells(row)));
    if (hasTotals) out.push(totalsRow(columns, g, 'subtotal'));
  });
  // Rows added after the groups were counted: listed rather than dropped.
  const stray = [...byGroup.entries()].filter(([value]) => !placed.has(value)).flatMap(([, list]) => list);
  if (stray.length > 0) {
    out.push({ kind: 'group', title: `${grouping.fieldLabel}: أخرى — ${stray.length} سجل` });
    stray.forEach((row) => out.push(cells(row)));
  }
  if (total && hasTotals) out.push(totalsRow(columns, total, 'total'));
  return out;
}
