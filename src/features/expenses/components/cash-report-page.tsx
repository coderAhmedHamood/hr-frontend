'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { ListFilterBar, type PeriodRange } from '@/components/ui/list-filter-bar';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { cashReport, type CashReport } from '../domain/reports';
import type { Minor } from '../domain/money';
import { Money } from './common';
import { last30Days, ReportExportMenu, ReportSummaryCard } from './report-common';
import { todayIso, useCurrency, useExpensesData } from './expenses-provider';

type CashRow = { key: keyof CashReport; label: string; direction: 'out' | 'in'; amount: Minor };

const CASH_LINES: Array<Omit<CashRow, 'amount'>> = [
  { key: 'expensesPaidDirect', label: 'مصروفات مدفوعة مباشرة', direction: 'out' },
  { key: 'custodyFunding', label: 'تسليم وتغذية العهد', direction: 'out' },
  { key: 'advancesPaid', label: 'سلف مدفوعة', direction: 'out' },
  { key: 'settlementsPaid', label: 'تعويضات وسداد للأشخاص', direction: 'out' },
  { key: 'custodyReturns', label: 'مرتجعات العهد', direction: 'in' },
  { key: 'settlementsReceived', label: 'سداد مستلم من الأشخاص', direction: 'in' },
];

function directionBadge(row: CashRow) {
  return row.direction === 'out' ? <Badge variant="destructive">خروج</Badge> : <Badge variant="success">دخول</Badge>;
}

export function CashReportPage() {
  const data = useExpensesData();
  const currency = useCurrency();
  const defaultPeriod = React.useMemo(() => last30Days(todayIso()), []);
  const [period, setPeriod] = React.useState<PeriodRange>(defaultPeriod);
  const [direction, setDirection] = React.useState<'all' | 'out' | 'in'>('all');

  const cash = React.useMemo(
    () => (data ? cashReport(data, { currency: currency.code, from: period.from || null, to: period.to || null }) : null),
    [data, currency.code, period],
  );

  const allRows = React.useMemo<CashRow[]>(() => (cash ? CASH_LINES.map((l) => ({ ...l, amount: cash[l.key] })) : []), [cash]);
  const rows = React.useMemo(() => allRows.filter((r) => direction === 'all' || r.direction === direction), [allRows, direction]);
  const cashOut = allRows.filter((r) => r.direction === 'out').reduce((t, r) => t + r.amount, 0);
  const cashIn = allRows.filter((r) => r.direction === 'in').reduce((t, r) => t + r.amount, 0);

  const isDefaultPeriod = period.from === defaultPeriod.from && period.to === defaultPeriod.to;
  const activeFilterCount = (direction !== 'all' ? 1 : 0) + (isDefaultPeriod ? 0 : 1);

  const exportExcel = React.useCallback(async () => {
    if (!cash) return;
    const sheet: XlsxCell[][] = [['البند', 'الاتجاه', 'المبلغ']];
    for (const r of rows) sheet.push([r.label, r.direction === 'out' ? 'خروج' : 'دخول', currency.format(r.amount)]);
    sheet.push(['الصافي', '', currency.format(cash.netOutflow)]);
    try {
      await downloadXlsxFromAoA(`cash-report-${period.from || 'all'}-${period.to || 'all'}.xlsx`, 'حركة النقد', sheet);
      toast.success('تم تنزيل ملف Excel.');
    } catch {
      toast.error('تعذر تصدير التقرير.');
    }
  }, [cash, rows, currency, period]);

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
        showStatusSection={false}
        showEmployeePicker={false}
        periodValue={period}
        onPeriodChange={setPeriod}
        defaultPeriod={defaultPeriod}
        inlineSelects={[
          {
            id: 'direction',
            value: direction,
            onChange: (v) => setDirection(v === 'out' || v === 'in' ? v : 'all'),
            placeholder: 'كل الحركات',
            options: [
              { value: 'all', label: 'كل الحركات' },
              { value: 'out', label: 'خروج' },
              { value: 'in', label: 'دخول' },
            ],
          },
        ]}
      />
    ),
    [period, defaultPeriod, direction],
  );

  const columns: ColumnDef<CashRow>[] = [
    { key: 'label', title: 'البند', render: (r) => <span className="font-medium">{r.label}</span> },
    { key: 'direction', title: 'الاتجاه', render: directionBadge },
    { key: 'amount', title: 'المبلغ', render: (r) => <Money value={r.amount} className="font-semibold" /> },
  ];

  const loading = !data;

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="حركة النقد" descriptionAr="خروج: مصروفات مباشرة وتمويل عهد وسلف وتعويضات؛ دخول: مرتجعات وسداد." iconName="Banknote" />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        <ReportSummaryCard label="خروج النقد" value={<Money value={cashOut} />} />
        <ReportSummaryCard label="دخول النقد" value={<Money value={cashIn} />} />
        <ReportSummaryCard label="الصافي" value={<Money value={cash?.netOutflow ?? 0} />} hint="خروج − دخول" />
      </div>

      <DataTable
        variant="directory"
        columns={columns}
        data={rows}
        keyExtractor={(r) => r.key}
        mobileCard={(r) => (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">{r.label}</p>
              {directionBadge(r)}
            </div>
            <Money value={r.amount} className="shrink-0 font-semibold" />
          </div>
        )}
        loading={loading}
        emptyText="لا حركات ضمن الفلاتر الحالية."
      />
    </div>
  );
}
