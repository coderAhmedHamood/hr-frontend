import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  dateListGroupOptions,
  listGroupLabel,
  sortListGroups,
  type GroupedListModel,
  type ListGroupModel,
  type ListGroupSummary,
} from '@/components/ui/list-group';
import { GroupedDataTable } from '@/components/ui/grouped-data-table';
import type { ColumnDef } from '@/components/ui/data-table';
import { registerExportRows, visibleExportColumns } from '@/components/pdf/lib/register-export-rows';

const g = (key: string | null, label: string | null, count: number, late = 0): ListGroupSummary => ({
  key,
  label,
  count,
  sums: { late },
});

describe('sortListGroups', () => {
  const groups = [g('b', 'سارة', 1, 30), g(null, null, 4, 0), g('a', 'أحمد', 3, 15)];

  it('orders by name, the group with no value last', () => {
    expect(sortListGroups(groups, { by: 'name', dir: 'asc' }, undefined).map((x) => x.key)).toEqual(['a', 'b', null]);
    expect(sortListGroups(groups, { by: 'name', dir: 'desc' }, undefined).map((x) => x.key)).toEqual(['b', 'a', null]);
  });

  it('orders by row count and by a total', () => {
    expect(sortListGroups(groups, { by: 'count', dir: 'desc' }, undefined).map((x) => x.key)).toEqual(['a', 'b', null]);
    expect(sortListGroups(groups, { by: 'sum:late', dir: 'desc' }, undefined).map((x) => x.key)).toEqual(['b', 'a', null]);
  });

  it('orders dates by their key, not their label', () => {
    const month = dateListGroupOptions().find((o) => o.key === 'month')!;
    const months = [g('2026-10', null, 1), g('2026-02', null, 1), g('2025-12', null, 1)];
    expect(sortListGroups(months, { by: 'name', dir: 'asc' }, month).map((x) => x.key)).toEqual([
      '2025-12', '2026-02', '2026-10',
    ]);
  });
});

describe('listGroupLabel', () => {
  it('uses the server label, then the option formatter, then the empty label', () => {
    const week = dateListGroupOptions().find((o) => o.key === 'week')!;
    expect(listGroupLabel(week, g('2026-10-04', null, 1))).toBe('أسبوع 2026-10-04 — 2026-10-10');
    expect(listGroupLabel({ key: 'branch', label: 'الفرع' }, g('x', 'فرع جدة', 1))).toBe('فرع جدة');
    expect(listGroupLabel({ key: 'branch', label: 'الفرع', emptyLabel: 'بدون فرع' }, g(null, null, 1))).toBe('بدون فرع');
  });
});

type Row = { id: string; name: string; late: number; groupKey: string | null };

const exportColumns = [
  { key: 'name', label: 'الموظف', kind: 'name' as const, value: (r: Row) => r.name },
  {
    key: 'late',
    label: 'تأخير',
    kind: 'number' as const,
    value: (r: Row) => String(r.late),
    total: (t: { sums: Record<string, number> }) => String(t.sums.late),
  },
];

describe('registerExportRows', () => {
  const rows: Row[] = [
    { id: '1', name: 'أحمد', late: 10, groupKey: 'a' },
    { id: '2', name: 'سارة', late: 30, groupKey: 'b' },
    { id: '3', name: 'أحمد', late: 5, groupKey: 'a' },
    { id: '4', name: 'خالد', late: 0, groupKey: null },
  ];

  it('lists the records and the grand total when not grouped', () => {
    const out = registerExportRows({ columns: exportColumns, rows, total: { count: 4, sums: { late: 45 } } });
    expect(out).toHaveLength(5);
    expect(out[4]).toEqual({ kind: 'total', cells: ['الإجمالي (4)', '45'] });
  });

  it('puts each record under its group, in the screen order, with subtotals', () => {
    const groups = [g('b', 'سارة', 1, 30), g('a', 'أحمد', 2, 15), g(null, null, 1, 0)];
    const out = registerExportRows({
      columns: exportColumns,
      rows,
      total: { count: 4, sums: { late: 45 } },
      grouping: {
        fieldLabel: 'الموظف',
        groups,
        labelOf: (x) => x.label ?? 'غير محدد',
        groupKeyOf: (r) => r.groupKey,
      },
    });
    expect(out).toEqual([
      { kind: 'group', title: 'الموظف: سارة — 1 سجل' },
      ['سارة', '30'],
      { kind: 'subtotal', cells: ['المجموع (1)', '30'] },
      { kind: 'group', title: 'الموظف: أحمد — 2 سجل' },
      ['أحمد', '10'],
      ['أحمد', '5'],
      { kind: 'subtotal', cells: ['المجموع (2)', '15'] },
      { kind: 'group', title: 'الموظف: غير محدد — 1 سجل' },
      ['خالد', '0'],
      { kind: 'subtotal', cells: ['المجموع (1)', '0'] },
      { kind: 'total', cells: ['الإجمالي (4)', '45'] },
    ]);
  });

  it('keeps rows whose group is missing from the summary', () => {
    const out = registerExportRows({
      columns: exportColumns,
      rows,
      grouping: { fieldLabel: 'الموظف', groups: [g('a', 'أحمد', 2)], labelOf: (x) => x.label ?? '', groupKeyOf: (r) => r.groupKey },
    });
    expect(out.filter(Array.isArray)).toHaveLength(4);
  });

  it('drops the columns hidden on screen', () => {
    expect(visibleExportColumns(exportColumns, (k) => k !== 'late').map((c) => c.label)).toEqual(['الموظف']);
  });
});

describe('GroupedDataTable', () => {
  const columns: ColumnDef<Row>[] = [
    { key: 'name', title: 'الموظف', render: (r) => r.name },
    { key: 'late', title: 'تأخير', render: (r) => r.late, total: (t) => `مجموع ${t.sums.late}` },
  ];
  const groups = [g('a', 'أحمد', 2, 15), g('b', 'سارة', 1, 30)];
  const group = {
    group: { by: 'employee', order: { by: 'name', dir: 'asc' } },
    groupBy: 'employee',
    option: { key: 'employee', label: 'الموظف' },
    sortGroups: (list: ListGroupSummary[]) => list,
    labelOf: (x: ListGroupSummary) => x.label ?? '',
  } as unknown as ListGroupModel;

  function makeList(overrides: Partial<GroupedListModel<Row>> = {}): GroupedListModel<Row> {
    return {
      summary: { groupBy: 'employee', groups, total: { count: 3, sums: { late: 45 } } },
      loading: false,
      expanded: new Set<string>(),
      rows: {},
      toggle: jest.fn(),
      expandAll: jest.fn(),
      collapseAll: jest.fn(),
      loadMore: jest.fn(),
      reload: jest.fn(),
      ...overrides,
    } as GroupedListModel<Row>;
  }

  it('shows each group with its count and subtotals, and the grand total', () => {
    render(<GroupedDataTable columns={columns} group={group} list={makeList()} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('أحمد')).toBeInTheDocument();
    expect(screen.getByText('مجموع 15')).toBeInTheDocument();
    expect(screen.getByText('مجموع 30')).toBeInTheDocument();
    expect(screen.getByText('مجموع 45')).toBeInTheDocument();
    expect(screen.getByText(/2 مجموعة/)).toBeInTheDocument();
  });

  it('opens a group on click and shows its rows and «عرض المزيد»', async () => {
    const list = makeList();
    const { rerender } = render(
      <GroupedDataTable columns={columns} group={group} list={list} keyExtractor={(r) => r.id} />,
    );
    await userEvent.click(screen.getByText('سارة'));
    expect(list.toggle).toHaveBeenCalledWith('b');

    const open = makeList({
      expanded: new Set(['a']),
      rows: { a: { items: [{ id: '1', name: 'سجل أول', late: 10, groupKey: 'a' }], total: 2, page: 1, loading: false } },
    });
    rerender(<GroupedDataTable columns={columns} group={group} list={open} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('سجل أول')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /عرض المزيد/ }));
    expect(open.loadMore).toHaveBeenCalledWith('a');
  });
});
