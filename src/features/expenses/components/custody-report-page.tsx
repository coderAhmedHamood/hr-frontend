'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Badge } from '@/components/ui/badge';
import { DataTable, usePagination, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { expensesRoutes } from '../constants/routes';
import type { CustodyBalance } from '../domain/ledger';
import { Money } from './common';
import { ReportExportMenu, ReportSummaryCard } from './report-common';
import { useCurrency, useDirectory, useLedger } from './expenses-provider';

const ALL = 'all';

function statusBadge(b: CustodyBalance) {
  return b.custody.status === 'open' ? <Badge variant="success">مفتوحة</Badge> : <Badge variant="subtle">مقفلة</Badge>;
}

export function CustodyReportPage() {
  const router = useRouter();
  const ledger = useLedger();
  const currency = useCurrency();
  const directory = useDirectory();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [holderId, setHolderId] = React.useState(ALL);
  const [status, setStatus] = React.useState(ALL);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const balances = React.useMemo(() => [...(ledger?.custodies.values() ?? [])], [ledger]);
  const holders = React.useMemo(
    () => [...new Set(balances.map((b) => b.custody.holderId))].map((id) => ({ value: id, label: directory.nameOf(id) })),
    [balances, directory],
  );

  const rows = React.useMemo(
    () =>
      balances
        .filter((b) => holderId === ALL || b.custody.holderId === holderId)
        .filter((b) => status === ALL || b.custody.status === status)
        .filter((b) => !search || directory.nameOf(b.custody.holderId).toLowerCase().includes(search) || b.custody.purpose.toLowerCase().includes(search))
        .sort((a, b) => (a.custody.status === b.custody.status ? b.actual - a.actual : a.custody.status === 'open' ? -1 : 1)),
    [balances, holderId, status, search, directory],
  );

  const totals = React.useMemo(
    () => ({
      issued: rows.reduce((t, r) => t + r.issued + r.toppedUp, 0),
      spent: rows.reduce((t, r) => t + r.spent, 0),
      returned: rows.reduce((t, r) => t + r.returned, 0),
      actual: rows.reduce((t, r) => t + r.actual, 0),
    }),
    [rows],
  );

  const { page, setPage, pageSize, setPageSize, slice: pagedRows, total } = usePagination(rows, DEFAULT_PAGE_SIZE);

  const activeFilterCount = [holderId, status].filter((v) => v !== ALL).length + (search ? 1 : 0);

  const exportExcel = React.useCallback(async () => {
    if (rows.length === 0) {
      toast.error('لا توجد عهد للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const sheet: XlsxCell[][] = [['الحامل', 'الغرض', 'الحالة', 'مسلّم', 'مصروف', 'مرتجع', 'الرصيد']];
    for (const r of rows) {
      sheet.push([
        directory.nameOf(r.custody.holderId),
        r.custody.purpose,
        r.custody.status === 'open' ? 'مفتوحة' : 'مقفلة',
        currency.format(r.issued + r.toppedUp),
        currency.format(r.spent),
        currency.format(r.returned),
        currency.format(r.actual),
      ]);
    }
    try {
      await downloadXlsxFromAoA('custody-report.xlsx', 'العهد', sheet);
      toast.success('تم تنزيل ملف Excel.');
    } catch {
      toast.error('تعذر تصدير التقرير.');
    }
  }, [rows, directory, currency]);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <ReportExportMenu onExcel={() => void exportExcel()} />
      </div>
    ),
    [activeFilterCount, exportExcel],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={<EntityFilterSearchField value={searchInput} onChange={setSearchInput} placeholder="ابحث بالحامل أو الغرض…" />}
        inlineSelects={[
          {
            id: 'holder',
            value: holderId,
            onChange: setHolderId,
            placeholder: 'كل الحاملين',
            options: [{ value: ALL, label: 'كل الحاملين' }, ...holders],
          },
          {
            id: 'status',
            value: status,
            onChange: setStatus,
            placeholder: 'كل الحالات',
            options: [
              { value: ALL, label: 'كل الحالات' },
              { value: 'open', label: 'مفتوحة' },
              { value: 'closed', label: 'مقفلة' },
            ],
          },
        ]}
      />
    ),
    [searchInput, holderId, status, holders],
  );

  const columns: ColumnDef<CustodyBalance>[] = [
    {
      key: 'holder',
      title: 'الحامل',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{directory.nameOf(r.custody.holderId)}</span>
          <span className="text-xs text-muted-foreground">{r.custody.purpose}</span>
        </div>
      ),
    },
    { key: 'issued', title: 'مسلّم', render: (r) => <Money value={r.issued + r.toppedUp} /> },
    { key: 'spent', title: 'مصروف', render: (r) => <Money value={r.spent} /> },
    { key: 'returned', title: 'مرتجع', hideOnMobile: true, render: (r) => <Money value={r.returned} /> },
    { key: 'actual', title: 'الرصيد', render: (r) => <Money value={r.actual} className="font-semibold" /> },
    { key: 'status', title: 'الحالة', render: statusBadge },
  ];

  const loading = !ledger;

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="تقرير العهد" descriptionAr="التسليم والتغذية والإرجاع تحويلات — لا تُحسب مصروفات." iconName="Wallet" />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <ReportSummaryCard label="مسلّم" value={<Money value={totals.issued} />} hint={`${rows.length} عهدة`} />
        <ReportSummaryCard label="مصروف" value={<Money value={totals.spent} />} />
        <ReportSummaryCard label="مرتجع" value={<Money value={totals.returned} />} />
        <ReportSummaryCard label="الرصيد" value={<Money value={totals.actual} />} />
      </div>

      <DirectoryPagedViews
        items={pagedRows}
        loading={loading}
        serverPagination={{ page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)), setPage, setPageSize }}
      >
        {(rowsPage) => (
          <DataTable
            variant="directory"
            columns={columns}
            data={rowsPage}
            keyExtractor={(r) => r.custody.id}
            onRowClick={(r) => router.push(expensesRoutes.custodyDetail(r.custody.id))}
            mobileCard={(r) => (
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{directory.nameOf(r.custody.holderId)}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.custody.purpose}</p>
                  </div>
                  <div className="shrink-0">{statusBadge(r)}</div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>مسلّم <Money value={r.issued + r.toppedUp} className="text-foreground" /></span>
                  <span>مصروف <Money value={r.spent} className="text-foreground" /></span>
                  <span>الرصيد <Money value={r.actual} className="font-semibold text-foreground" /></span>
                </div>
              </div>
            )}
            loading={loading}
            emptyText="لا عهد ضمن الفلاتر الحالية."
          />
        )}
      </DirectoryPagedViews>
    </div>
  );
}
