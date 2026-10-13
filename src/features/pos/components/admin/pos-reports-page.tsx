'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Badge } from '@/components/ui/badge';
import { DataTable, usePagination, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { ListFilterBar, type PeriodRange } from '@/components/ui/list-filter-bar';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { cn } from '@/shared/utils';
import {
  ReportExportMenu,
  ShareBar,
} from '@/features/expenses/components/report-common';
import { PAYMENT_METHOD_LABELS, type PosPaymentMethod } from '@/features/pos/domain/types';
import { usePosContext } from '@/features/pos/hooks/use-pos-context';
import { formatAmount, formatDateTime, formatMoney } from '@/features/pos/lib/format';
import {
  GROUPINGS,
  NO_FILTERS,
  dayOf,
  discountedLines,
  groupBy as groupFacts,
  lineFacts,
  paymentRows,
  returnsInPeriod,
  sortedForTime,
  totalsOf,
  type GroupRow,
  type Grouping,
  type LineFact,
  type ReportFilters,
} from '@/features/pos/lib/sales-report';
import { PosGate } from '@/features/pos/components/shared/pos-shared';

const ALL = 'all';

/** What the table shows: a grouping of the sales, or one of the lists. */
type View = Grouping | 'payments' | 'discounts' | 'returns';

const VIEWS: Array<{ id: View; label: string; column: string }> = [
  { id: 'product', label: 'حسب الصنف', column: 'الصنف' },
  { id: 'category', label: 'حسب الفئة', column: 'الفئة' },
  { id: 'day', label: 'حسب اليوم', column: 'اليوم' },
  { id: 'hour', label: 'حسب الساعة', column: 'الساعة' },
  { id: 'weekday', label: 'حسب يوم الأسبوع', column: 'يوم الأسبوع' },
  { id: 'cashier', label: 'حسب الكاشير', column: 'الكاشير' },
  { id: 'register', label: 'حسب نقطة البيع', column: 'نقطة البيع' },
  { id: 'session', label: 'حسب الوردية', column: 'الوردية' },
  { id: 'customer', label: 'حسب العميل', column: 'العميل' },
  { id: 'invoice', label: 'الفواتير', column: 'الفاتورة' },
  { id: 'payments', label: 'وسائل الدفع', column: 'الوسيلة' },
  { id: 'discounts', label: 'الخصومات وتغيير الأسعار', column: 'الصنف' },
  { id: 'returns', label: 'المرتجعات', column: 'المرتجع' },
];

const today = () => dayOf(new Date().toISOString());

function Profit({ value, currency }: { value: number; currency?: string | null }) {
  return (
    <span className={cn('tabular-nums', value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : '')}>
      {formatMoney(value, currency)}
    </span>
  );
}

const marginText = (m: number | null) => (m == null ? '—' : `${m}%`);

function Reports() {
  const { data, currency } = usePosContext();
  const defaultPeriod = React.useMemo<PeriodRange>(() => ({ from: today(), to: today() }), []);
  const [period, setPeriod] = React.useState<PeriodRange>(defaultPeriod);
  const [view, setView] = React.useState<View>('product');
  const [registerId, setRegisterId] = React.useState(ALL);
  const [cashierName, setCashierName] = React.useState(ALL);
  const [categoryId, setCategoryId] = React.useState(ALL);
  const [paymentMethod, setPaymentMethod] = React.useState(ALL);
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: ReportFilters = React.useMemo(
    () => ({
      from: period.from || null,
      to: period.to || null,
      currency,
      registerId: registerId === ALL ? null : registerId,
      cashierName: cashierName === ALL ? null : cashierName,
      categoryId: categoryId === ALL ? null : categoryId,
      paymentMethod: paymentMethod === ALL ? null : (paymentMethod as PosPaymentMethod),
      product: search,
    }),
    [period, registerId, cashierName, categoryId, paymentMethod, search, currency],
  );

  const facts = React.useMemo(() => lineFacts(data, filters), [data, filters]);
  const totals = React.useMemo(() => totalsOf(facts), [facts]);

  // Choices come from the period's sales, before the other filters.
  const periodFacts = React.useMemo(
    () => lineFacts(data, { ...NO_FILTERS, from: filters.from, to: filters.to }),
    [data, filters.from, filters.to],
  );
  const cashiers = React.useMemo(
    () => [...new Set(periodFacts.map((f) => f.cashierName))].sort((a, b) => a.localeCompare(b, 'ar')),
    [periodFacts],
  );
  const categories = React.useMemo(
    () => [...new Map(periodFacts.filter((f) => f.categoryId).map((f) => [f.categoryId!, f.categoryName])).entries()],
    [periodFacts],
  );

  const viewMeta = VIEWS.find((v) => v.id === view)!;
  const isGrouping = view in GROUPINGS;
  const groupRows = React.useMemo(
    () => (isGrouping ? sortedForTime(view as Grouping, groupFacts(facts, GROUPINGS[view as Grouping])) : []),
    [facts, view, isGrouping],
  );
  const payments = React.useMemo(() => paymentRows(data, filters), [data, filters]);
  const discounted = React.useMemo(() => discountedLines(facts), [facts]);
  const returns = React.useMemo(() => returnsInPeriod(data, filters), [data, filters]);

  const isDefaultPeriod = period.from === defaultPeriod.from && period.to === defaultPeriod.to;
  const activeFilterCount =
    [registerId, cashierName, categoryId, paymentMethod].filter((v) => v !== ALL).length +
    (search ? 1 : 0) +
    (view !== 'product' ? 1 : 0) +
    (isDefaultPeriod ? 0 : 1);

  const stamp = `${filters.from ?? 'all'}-${filters.to ?? 'all'}`;

  const exportExcel = React.useCallback(async () => {
    let sheet: XlsxCell[][];
    if (isGrouping) {
      sheet = [
        [viewMeta.column, 'الفواتير', 'الكمية', 'صافي المبيعات', 'الخصم', 'المرتجع', 'الضريبة', 'التكلفة', 'الربح', 'الهامش %', 'بلا تكلفة'],
        ...groupRows.map((r) => [
          r.detail ? `${r.label} (${r.detail})` : r.label,
          r.invoices,
          r.units,
          r.revenue,
          r.discount,
          r.returned,
          r.tax,
          r.cost,
          r.profit,
          r.margin,
          r.uncostedRevenue,
        ]),
      ];
    } else if (view === 'payments') {
      sheet = [['الوسيلة', 'العمليات', 'المحصّل', 'المردود', 'الصافي'], ...payments.map((p) => [p.label, p.count, p.collected, p.refunded, p.net])];
    } else if (view === 'discounts') {
      sheet = [
        ['التاريخ', 'الفاتورة', 'الصنف', 'الكاشير', 'السعر الأصلي', 'سعر البيع', 'الخصم', 'التكلفة'],
        ...discounted.map((f) => [formatDateTime(f.date), f.saleNumber, f.productName, f.cashierName, f.sourcePrice, f.unitPrice, f.discount, f.unitCost]),
      ];
    } else {
      sheet = [
        ['التاريخ', 'رقم المرتجع', 'على الفاتورة', 'السبب', 'الأصناف', 'الطريقة', 'المبلغ', 'حالة الرد'],
        ...returns.map((r) => [
          formatDateTime(r.createdAt),
          r.number,
          r.saleNumber,
          r.reason,
          r.lines.map((l) => `${l.name} × ${l.quantity}`).join('، '),
          PAYMENT_METHOD_LABELS[r.refund.method],
          r.refund.amount,
          r.refund.status === 'done' ? 'تم' : 'معلّق',
        ]),
      ];
    }
    if (sheet.length <= 1) {
      toast.error('لا توجد بيانات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    try {
      await downloadXlsxFromAoA(`pos-${view}-${stamp}.xlsx`, viewMeta.label, sheet);
      toast.success('تم تنزيل ملف Excel.');
    } catch {
      toast.error('تعذر تصدير التقرير.');
    }
  }, [isGrouping, view, viewMeta, groupRows, payments, discounted, returns, stamp]);

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
        leadingFilters={
          <EntityFilterSearchField value={searchInput} onChange={setSearchInput} placeholder="ابحث بالصنف أو رمزه…" />
        }
        inlineSelects={[
          {
            id: 'view',
            value: view === 'product' ? ALL : view,
            onChange: (v) => setView(v === ALL ? 'product' : (v as View)),
            placeholder: 'حسب الصنف',
            options: [
              { value: ALL, label: 'حسب الصنف' },
              ...VIEWS.filter((v) => v.id !== 'product').map((v) => ({ value: v.id, label: v.label })),
            ],
          },
          {
            id: 'register',
            value: registerId,
            onChange: setRegisterId,
            placeholder: 'كل نقاط البيع',
            options: [{ value: ALL, label: 'كل نقاط البيع' }, ...data.registers.map((r) => ({ value: r.id, label: r.name }))],
          },
          {
            id: 'cashier',
            value: cashierName,
            onChange: setCashierName,
            placeholder: 'كل الكاشيرية',
            options: [{ value: ALL, label: 'كل الكاشيرية' }, ...cashiers.map((c) => ({ value: c, label: c }))],
          },
          ...(categories.length > 0
            ? [
                {
                  id: 'category',
                  value: categoryId,
                  onChange: setCategoryId,
                  placeholder: 'كل الفئات',
                  options: [{ value: ALL, label: 'كل الفئات' }, ...categories.map(([id, name]) => ({ value: id, label: name }))],
                },
              ]
            : []),
          {
            id: 'payment',
            value: paymentMethod,
            onChange: setPaymentMethod,
            placeholder: 'كل وسائل الدفع',
            options: [
              { value: ALL, label: 'كل وسائل الدفع' },
              ...(Object.keys(PAYMENT_METHOD_LABELS) as PosPaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] })),
            ],
          },
        ]}
      />
    ),
    [period, defaultPeriod, searchInput, view, registerId, cashierName, categoryId, paymentMethod, data.registers, cashiers, categories],
  );

  /* ── Grouped table ── */
  const maxRevenue = Math.max(0, ...groupRows.map((r) => r.revenue));
  const groupColumns: ColumnDef<GroupRow>[] = [
    {
      key: 'label',
      title: viewMeta.column,
      render: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{r.label}</span>
          {r.detail ? <span className="text-xs text-muted-foreground" dir="auto">{r.detail}</span> : null}
        </div>
      ),
    },
    { key: 'units', title: 'الكمية', render: (r) => <span className="tabular-nums">{formatAmount(r.units)}</span> },
    { key: 'invoices', title: 'الفواتير', hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.invoices}</span> },
    { key: 'revenue', title: 'صافي المبيعات', render: (r) => <span className="font-semibold tabular-nums">{formatMoney(r.revenue, currency)}</span> },
    {
      key: 'cost',
      title: 'التكلفة',
      render: (r) => (r.costedRevenue > 0 ? <span className="tabular-nums">{formatAmount(r.cost)}</span> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: 'profit',
      title: 'الربح',
      render: (r) => (r.costedRevenue > 0 ? <Profit value={r.profit} /> : <span className="text-muted-foreground">—</span>),
    },
    { key: 'margin', title: 'الهامش', hideOnMobile: true, render: (r) => <span className="tabular-nums">{marginText(r.margin)}</span> },
    {
      key: 'share',
      title: 'من المبيعات',
      hideOnMobile: true,
      render: (r) => <ShareBar value={r.revenue} max={maxRevenue} total={totals.revenue} />,
    },
  ];

  const grouped = usePagination(groupRows, DEFAULT_PAGE_SIZE);
  const discountsPage = usePagination(discounted, DEFAULT_PAGE_SIZE);
  const returnsPage = usePagination(returns, DEFAULT_PAGE_SIZE);
  const pagination = (p: { page: number; pageSize: number; total: number; setPage: (n: number) => void; setPageSize: (n: number) => void }) => ({
    page: p.page,
    pageSize: p.pageSize,
    total: p.total,
    totalPages: Math.max(1, Math.ceil(p.total / p.pageSize)),
    setPage: p.setPage,
    setPageSize: p.setPageSize,
  });

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="تقارير المبيعات"
        descriptionAr="كل بيع بسعره الذي بيع به وتكلفته لحظة البيع."
        iconName="BarChart3"
      />

      {isGrouping ? (
        <DirectoryPagedViews items={grouped.slice} loading={false} serverPagination={pagination(grouped)}>
          {(rowsPage) => (
            <DataTable
              variant="directory"
              columns={groupColumns}
              data={rowsPage}
              keyExtractor={(r) => r.key}
              mobileCard={(r) => (
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.label}</p>
                      {r.detail ? <p className="truncate text-xs text-muted-foreground">{r.detail}</p> : null}
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{formatMoney(r.revenue, currency)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>الكمية {formatAmount(r.units)}</span>
                    {r.costedRevenue > 0 ? (
                      <>
                        <span>
                          التكلفة <span className="text-foreground">{formatAmount(r.cost)}</span>
                        </span>
                        <span>
                          الربح <Profit value={r.profit} />
                        </span>
                        <span>الهامش {marginText(r.margin)}</span>
                      </>
                    ) : (
                      <span>بلا تكلفة</span>
                    )}
                  </div>
                </div>
              )}
              emptyText="لا مبيعات ضمن الفلاتر الحالية."
            />
          )}
        </DirectoryPagedViews>
      ) : view === 'payments' ? (
        <DataTable
          variant="directory"
          columns={[
            { key: 'label', title: 'الوسيلة', render: (p) => <span className="font-medium">{p.label}</span> },
            { key: 'count', title: 'العمليات', render: (p) => <span className="tabular-nums">{p.count}</span> },
            { key: 'collected', title: 'المحصّل', render: (p) => <span className="tabular-nums">{formatAmount(p.collected)}</span> },
            { key: 'refunded', title: 'المردود', render: (p) => <span className="tabular-nums">{formatAmount(p.refunded)}</span> },
            { key: 'net', title: 'الصافي', render: (p) => <span className="font-semibold tabular-nums">{formatMoney(p.net, currency)}</span> },
          ]}
          data={payments}
          keyExtractor={(p) => p.method}
          emptyText="لا مدفوعات ضمن الفلاتر الحالية."
        />
      ) : view === 'discounts' ? (
        <DirectoryPagedViews items={discountsPage.slice} loading={false} serverPagination={pagination(discountsPage)}>
          {(rowsPage) => (
            <DataTable
              variant="directory"
              columns={discountColumns(currency)}
              data={rowsPage}
              keyExtractor={(f) => `${f.saleId}:${f.productKey}:${f.date}`}
              emptyText="لا خصومات ولا أسعار معدّلة ضمن الفلاتر الحالية."
            />
          )}
        </DirectoryPagedViews>
      ) : (
        <DirectoryPagedViews items={returnsPage.slice} loading={false} serverPagination={pagination(returnsPage)}>
          {(rowsPage) => (
            <DataTable
              variant="directory"
              columns={[
                {
                  key: 'number',
                  title: 'المرتجع',
                  render: (r) => (
                    <div className="flex flex-col">
                      <span className="font-medium" dir="ltr">
                        {r.number}
                      </span>
                      <span className="text-xs text-muted-foreground">على {r.saleNumber}</span>
                    </div>
                  ),
                },
                { key: 'date', title: 'التاريخ', hideOnMobile: true, render: (r) => formatDateTime(r.createdAt) },
                { key: 'reason', title: 'السبب', hideOnMobile: true, render: (r) => r.reason },
                {
                  key: 'lines',
                  title: 'الأصناف',
                  hideOnMobile: true,
                  render: (r) => r.lines.map((l) => `${l.name} × ${l.quantity}`).join('، '),
                },
                {
                  key: 'amount',
                  title: 'المبلغ',
                  render: (r) => <span className="font-semibold tabular-nums">{formatMoney(r.refund.amount, currency)}</span>,
                },
                {
                  key: 'status',
                  title: 'الرد',
                  render: (r) =>
                    r.refund.status === 'done' ? <Badge variant="success">تم</Badge> : <Badge variant="warning">معلّق</Badge>,
                },
              ]}
              data={rowsPage}
              keyExtractor={(r) => r.id}
              emptyText="لا مرتجعات ضمن الفلاتر الحالية."
            />
          )}
        </DirectoryPagedViews>
      )}
    </div>
  );
}

function discountColumns(currency: string | null): ColumnDef<LineFact>[] {
  return [
    {
      key: 'product',
      title: 'الصنف',
      render: (f) => (
        <div className="flex flex-col">
          <span className="font-medium">{f.productName}</span>
          <span className="text-xs text-muted-foreground">
            {f.saleNumber} · {f.cashierName}
          </span>
        </div>
      ),
    },
    { key: 'date', title: 'التاريخ', hideOnMobile: true, render: (f) => formatDateTime(f.date) },
    { key: 'source', title: 'السعر الأصلي', render: (f) => <span className="tabular-nums">{formatAmount(f.sourcePrice)}</span> },
    {
      key: 'price',
      title: 'سعر البيع',
      render: (f) => (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          {formatAmount(f.unitPrice)}
          {f.priceOverridden ? <Badge variant="warning">معدّل</Badge> : null}
        </span>
      ),
    },
    { key: 'discount', title: 'الخصم', render: (f) => <span className="tabular-nums">{formatMoney(f.discount, currency)}</span> },
    {
      key: 'cost',
      title: 'تكلفة الوحدة',
      hideOnMobile: true,
      render: (f) => (f.unitCost == null ? '—' : <span className="tabular-nums">{formatAmount(f.unitCost)}</span>),
    },
  ];
}

export function PosReportsPage() {
  return (
    <PosGate permission="pos.reports.read">
      <Reports />
    </PosGate>
  );
}
