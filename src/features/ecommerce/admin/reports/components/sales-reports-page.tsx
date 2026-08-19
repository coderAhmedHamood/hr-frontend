'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Ban,
  Download,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/auth/hooks/use-can';
import { ApiError } from '@/features/hr/lib/api/client';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import {
  useSalesByCity,
  useSalesByPartner,
  useSalesByPayment,
  useSalesByProduct,
  useSalesByStatus,
  useSalesLines,
  useSalesSummary,
  useSalesTimeseries,
} from '@/features/ecommerce/admin/reports/hooks/use-sales-reports';
import type {
  SalesReportFilters,
  SalesReportGranularity,
  StoreOrderSource,
  StorePaymentMethod,
  StorePaymentStatus,
} from '@/features/ecommerce/admin/reports/lib/api/sales-reports-api';
import { SALES_REPORTS_READ } from '@/features/ecommerce/admin/reports/permissions';
import {
  ORDER_STATUS_LABELS_AR,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
} from '@/features/ecommerce/domain/constants/order-status';
import type { OrderStatus } from '@/features/ecommerce/domain/types/order';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { fromDecimalString } from '@/features/ecommerce/storefront/lib/api/store-http';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { cn } from '@/shared/utils';

const CHART_COLORS = ['#0f766e', '#0369a1', '#b45309', '#be123c', '#7c3aed', '#15803d', '#475569'];

function startOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function money(amount: string | number | null | undefined, currency = 'YER'): string {
  return formatPrice({ amount: fromDecimalString(amount), currency: currency || 'YER' });
}

function downloadCsv(filename: string, rows: string[][]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map((cell) => escape(cell)).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return null;
}

export function SalesReportsPage() {
  const can = useCan();
  const canRead = can(SALES_REPORTS_READ);
  const companyId = getStorefrontCompanyId();

  const [from, setFrom] = React.useState(startOfMonthIso);
  const [to, setTo] = React.useState(todayIso);
  const [status, setStatus] = React.useState<OrderStatus | 'all'>('all');
  const [paymentStatus, setPaymentStatus] = React.useState<StorePaymentStatus | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = React.useState<StorePaymentMethod | 'all'>('all');
  const [source, setSource] = React.useState<StoreOrderSource | 'all'>('all');
  const [hasPartner, setHasPartner] = React.useState<'all' | 'yes' | 'no'>('all');
  const [city, setCity] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [granularity, setGranularity] = React.useState<SalesReportGranularity>('day');
  const [tab, setTab] = React.useState<'dashboard' | 'ops' | 'lines'>('dashboard');
  const [linesPage, setLinesPage] = React.useState(1);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = React.useMemo<SalesReportFilters>(
    () => ({
      companyId,
      from: from || undefined,
      to: to || undefined,
      status,
      paymentStatus,
      paymentMethod,
      source,
      hasPartner: hasPartner === 'all' ? undefined : hasPartner === 'yes',
      city: city.trim() || undefined,
      search: search || undefined,
    }),
    [companyId, from, to, status, paymentStatus, paymentMethod, source, hasPartner, city, search],
  );

  React.useEffect(() => {
    setLinesPage(1);
  }, [from, to, status, paymentStatus, paymentMethod, source, hasPartner, city, search]);

  // Always attempt load when company is set — backend enforces `sta.reports.read`.
  const summary = useSalesSummary(filters, Boolean(companyId));
  const timeseries = useSalesTimeseries(filters, granularity, Boolean(companyId) && tab === 'dashboard');
  const byProduct = useSalesByProduct(filters, 15, Boolean(companyId) && tab === 'dashboard');
  const byCity = useSalesByCity(filters, 15, Boolean(companyId) && tab === 'dashboard');
  const byPartner = useSalesByPartner(filters, 15, Boolean(companyId) && tab === 'dashboard');
  const byStatus = useSalesByStatus(filters, Boolean(companyId) && (tab === 'ops' || tab === 'dashboard'));
  const byPayment = useSalesByPayment(filters, Boolean(companyId) && tab === 'ops');
  const lines = useSalesLines(filters, linesPage, 50, Boolean(companyId) && tab === 'lines');

  const currency = summary.data?.currencyCode || 'YER';

  const chartPoints = React.useMemo(
    () =>
      (timeseries.data?.points ?? []).map((point) => ({
        key: point.periodKey,
        orders: point.ordersCount,
        revenue: fromDecimalString(point.revenueTotal),
        units: point.unitsSold,
      })),
    [timeseries.data?.points],
  );

  const statusChart = React.useMemo(
    () =>
      (byStatus.data ?? []).map((row) => ({
        name: ORDER_STATUS_LABELS_AR[row.status] ?? row.status,
        value: row.ordersCount,
        revenue: fromDecimalString(row.revenueTotal),
      })),
    [byStatus.data],
  );

  function exportLines() {
    const items = lines.data?.items ?? [];
    downloadCsv('sales-lines.csv', [
      [
        'orderNumber',
        'orderCreatedAt',
        'status',
        'paymentStatus',
        'paymentMethod',
        'customer',
        'city',
        'product',
        'quantity',
        'unitPrice',
        'lineTotal',
      ],
      ...items.map((row) => [
        row.orderNumber,
        row.orderCreatedAt,
        row.status,
        row.paymentStatus,
        row.paymentMethod,
        row.customerNameAr,
        row.shipCity,
        row.productName,
        String(row.quantity),
        row.unitPriceAmount,
        row.lineTotalAmount,
      ]),
    ]);
  }

  const activeError =
    summary.error ??
    (tab === 'dashboard'
      ? timeseries.error ?? byProduct.error ?? byCity.error ?? byPartner.error ?? byStatus.error
      : null) ??
    (tab === 'ops' ? byStatus.error ?? byPayment.error : null) ??
    (tab === 'lines' ? lines.error : null);
  const anyError = Boolean(activeError);
  const apiMsg = errorMessage(activeError);

  function refreshAll() {
    void summary.refetch();
    void timeseries.refetch();
    void byProduct.refetch();
    void byCity.refetch();
    void byPartner.refetch();
    void byStatus.refetch();
    void byPayment.refetch();
    void lines.refetch();
  }

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
      </div>
    ),
    [],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showStatusSection={false}
        showEmployeePicker={false}
        showDateSection
        optionalDateRange
        periodValue={{ from, to }}
        onPeriodChange={({ from: nextFrom, to: nextTo }) => {
          setFrom(nextFrom);
          setTo(nextTo);
        }}
        leadingFilters={
          <EntityFilterSearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="رقم طلب / اسم / هاتف"
          />
        }
        inlineSelects={[
          {
            id: 'status',
            value: status,
            onChange: (v) => setStatus(v as OrderStatus | 'all'),
            placeholder: 'حالة الطلب',
            options: [
              { value: 'all', label: 'كل الحالات' },
              ...Object.entries(ORDER_STATUS_LABELS_AR).map(([value, label]) => ({ value, label })),
            ],
          },
          {
            id: 'paymentStatus',
            value: paymentStatus,
            onChange: (v) => setPaymentStatus(v as StorePaymentStatus | 'all'),
            placeholder: 'حالة الدفع',
            options: [
              { value: 'all', label: 'كل حالات الدفع' },
              ...Object.entries(PAYMENT_STATUS_LABELS_AR).map(([value, label]) => ({ value, label })),
            ],
          },
          {
            id: 'paymentMethod',
            value: paymentMethod,
            onChange: (v) => setPaymentMethod(v as StorePaymentMethod | 'all'),
            placeholder: 'طريقة الدفع',
            options: [
              { value: 'all', label: 'كل طرق الدفع' },
              ...Object.entries(PAYMENT_METHOD_LABELS_AR).map(([value, label]) => ({ value, label })),
            ],
          },
          {
            id: 'source',
            value: source,
            onChange: (v) => setSource(v as StoreOrderSource | 'all'),
            placeholder: 'المصدر',
            options: [
              { value: 'all', label: 'كل المصادر' },
              { value: 'storefront', label: 'المتجر' },
              { value: 'seed', label: 'Seed' },
            ],
          },
          {
            id: 'hasPartner',
            value: hasPartner,
            onChange: (v) => setHasPartner(v as 'all' | 'yes' | 'no'),
            placeholder: 'العميل',
            options: [
              { value: 'all', label: 'الكل' },
              { value: 'yes', label: 'مسجّل' },
              { value: 'no', label: 'ضيف' },
            ],
          },
        ]}
        beforeEmployeePicker={
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="المدينة"
            className="h-8 w-32 text-xs"
          />
        }
        trailingActions={
          <Button type="button" size="sm" variant="outline" onClick={refreshAll}>
            <RefreshCw className="me-1.5 h-3.5 w-3.5" />
            تحديث
          </Button>
        }
      />
    ),
    [
      from,
      to,
      status,
      paymentStatus,
      paymentMethod,
      source,
      hasPartner,
      city,
      searchInput,
    ],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <SetPageTitle
        titleAr="تقارير المبيعات"
        descriptionAr="إيراد الطلبات، الاتجاه الزمني، المنتجات والمدن والعملاء."
        iconName="BarChart3"
      />

      {!companyId ? (
        <p className="text-sm text-muted-foreground">اختر شركة لعرض التقارير.</p>
      ) : (
        <>
          {!canRead ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              قد تحتاج صلاحية <span dir="ltr">{SALES_REPORTS_READ}</span> — بعد سحب الـ Backend شغّل{' '}
              <span dir="ltr">npm run system:init</span> ثم أعد تسجيل الدخول.
            </div>
          ) : null}

          {anyError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              تعذر تحميل بعض بيانات التقرير
              {apiMsg ? <> — {apiMsg}</> : null}. تحقق من الصلاحية{' '}
              <span dir="ltr">{SALES_REPORTS_READ}</span> وأن الـ Backend محدّث.
            </div>
          ) : null}

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="dashboard">لوحة المبيعات</TabsTrigger>
              <TabsTrigger value="ops">تشغيلي</TabsTrigger>
              <TabsTrigger value="lines">تفصيلي</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <KpiCard
                  label="الإيراد"
                  value={money(summary.data?.revenueTotal, currency)}
                  hint={`${summary.data?.revenueOrdersCount ?? 0} طلب للإيراد`}
                  icon={TrendingUp}
                  loading={summary.isLoading}
                />
                <KpiCard
                  label="الطلبات"
                  value={String(summary.data?.ordersCount ?? 0)}
                  hint={`${summary.data?.partnerOrdersCount ?? 0} مسجّل · ${summary.data?.guestOrdersCount ?? 0} ضيف`}
                  icon={ShoppingBag}
                  loading={summary.isLoading}
                />
                <KpiCard
                  label="متوسط الطلب"
                  value={money(summary.data?.averageOrderValue, currency)}
                  hint="AOV"
                  icon={Wallet}
                  loading={summary.isLoading}
                />
                <KpiCard
                  label="محصّل"
                  value={money(summary.data?.paidAmount, currency)}
                  hint={`${summary.data?.paidOrdersCount ?? 0} مدفوع`}
                  icon={Wallet}
                  loading={summary.isLoading}
                />
                <KpiCard
                  label="وحدات مباعة"
                  value={String(summary.data?.unitsSold ?? 0)}
                  hint={`تسليم ${summary.data?.deliveredOrdersCount ?? 0}`}
                  icon={Package}
                  loading={summary.isLoading}
                />
                <KpiCard
                  label="ملغى"
                  value={String(summary.data?.cancelledOrdersCount ?? 0)}
                  hint={`مسترد ${summary.data?.refundedOrdersCount ?? 0}`}
                  icon={Ban}
                  loading={summary.isLoading}
                  tone="warn"
                />
              </div>

              <section className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">الاتجاه الزمني</h2>
                    <p className="text-xs text-muted-foreground">إيراد وعدد الطلبات</p>
                  </div>
                  <Select
                    value={granularity}
                    onValueChange={(v) => setGranularity(v as SalesReportGranularity)}
                  >
                    <SelectTrigger className="h-9 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">يومي</SelectItem>
                      <SelectItem value="week">أسبوعي</SelectItem>
                      <SelectItem value="month">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {timeseries.isLoading ? (
                  <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
                ) : chartPoints.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <div className="h-72 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="right" dataKey="orders" name="طلبات" fill="#94a3b8" radius={4} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          name="إيراد"
                          stroke="#0f766e"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <div className="grid gap-4 xl:grid-cols-2">
                <SimpleTable
                  title="أفضل المنتجات"
                  loading={byProduct.isLoading}
                  empty="لا مبيعات منتجات في الفترة."
                  headers={['المنتج', 'طلبات', 'وحدات', 'إيراد البنود']}
                  rows={(byProduct.data ?? []).map((row) => [
                    row.productName,
                    String(row.ordersCount),
                    String(row.unitsSold),
                    money(row.lineRevenueTotal, currency),
                  ])}
                />
                <SimpleTable
                  title="المدن"
                  loading={byCity.isLoading}
                  empty="لا بيانات مدن في الفترة."
                  headers={['المدينة', 'طلبات', 'وحدات', 'إيراد']}
                  rows={(byCity.data ?? []).map((row) => [
                    row.cityName || '—',
                    String(row.ordersCount),
                    String(row.unitsSold),
                    money(row.revenueTotal, currency),
                  ])}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <SimpleTable
                  title="أفضل العملاء"
                  loading={byPartner.isLoading}
                  empty="لا بيانات عملاء في الفترة."
                  headers={['العميل', 'طلبات', 'وحدات', 'إيراد']}
                  rows={(byPartner.data ?? []).map((row) => [
                    row.label || (row.partnerId ? 'شريك' : 'ضيوف مجمّعون'),
                    String(row.ordersCount),
                    String(row.unitsSold),
                    money(row.revenueTotal, currency),
                  ])}
                />
                <section className="rounded-2xl border border-border bg-card p-4">
                  <h2 className="mb-1 text-sm font-semibold">توزيع الحالات</h2>
                  <p className="mb-4 text-xs text-muted-foreground">أين تتوقف الطلبات في المسار</p>
                  {byStatus.isLoading ? (
                    <div className="h-56 animate-pulse rounded-xl bg-muted/40" />
                  ) : statusChart.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className="h-56 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={48} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" name="طلبات" radius={4}>
                            {statusChart.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              </div>
            </TabsContent>

            <TabsContent value="ops" className="mt-4 space-y-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-2xl border border-border bg-card p-4">
                  <h2 className="mb-1 text-sm font-semibold">توزيع الحالات</h2>
                  <p className="mb-4 text-xs text-muted-foreground">قمع التحويل واختناقات المسار</p>
                  {byStatus.isLoading ? (
                    <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
                  ) : statusChart.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className="h-64 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChart}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {statusChart.map((_, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <ul className="mt-3 space-y-1.5">
                    {(byStatus.data ?? []).map((row) => (
                      <li
                        key={row.status}
                        className="flex items-center justify-between text-sm text-muted-foreground"
                      >
                        <span>{ORDER_STATUS_LABELS_AR[row.status] ?? row.status}</span>
                        <span className="tabular-nums">
                          {row.ordersCount} · {money(row.revenueTotal, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-border bg-card p-4">
                  <h2 className="mb-1 text-sm font-semibold">طرق الدفع</h2>
                  <p className="mb-4 text-xs text-muted-foreground">COD / شبكة × حالة الدفع</p>
                  {byPayment.isLoading ? (
                    <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
                  ) : (byPayment.data ?? []).length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <div className="h-64 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(byPayment.data ?? []).map((row) => ({
                            name: `${PAYMENT_METHOD_LABELS_AR[row.paymentMethod]} · ${PAYMENT_STATUS_LABELS_AR[row.paymentStatus]}`,
                            orders: row.ordersCount,
                            revenue: fromDecimalString(row.revenueTotal),
                          }))}
                          margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="orders" name="طلبات" fill="#0369a1" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <ul className="mt-3 space-y-1.5">
                    {(byPayment.data ?? []).map((row) => (
                      <li
                        key={`${row.paymentMethod}-${row.paymentStatus}`}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {PAYMENT_METHOD_LABELS_AR[row.paymentMethod]} ·{' '}
                          {PAYMENT_STATUS_LABELS_AR[row.paymentStatus]}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {row.ordersCount} · {money(row.revenueTotal, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="lines" className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="tabular-nums">
                  {lines.data?.pagination.total ?? 0} بند
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ms-auto"
                  disabled={(lines.data?.items.length ?? 0) === 0}
                  onClick={exportLines}
                >
                  <Download className="me-1.5 h-3.5 w-3.5" />
                  تصدير CSV
                </Button>
              </div>

              {lines.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
                  ))}
                </div>
              ) : (lines.data?.items.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                  لا توجد بنود ضمن الفلاتر.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 text-start text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5 font-medium">الطلب</th>
                        <th className="px-3 py-2.5 font-medium">التاريخ</th>
                        <th className="px-3 py-2.5 font-medium">الحالة</th>
                        <th className="px-3 py-2.5 font-medium">الدفع</th>
                        <th className="px-3 py-2.5 font-medium">العميل</th>
                        <th className="px-3 py-2.5 font-medium">المدينة</th>
                        <th className="px-3 py-2.5 font-medium">المنتج</th>
                        <th className="px-3 py-2.5 font-medium">الكمية</th>
                        <th className="px-3 py-2.5 font-medium">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(lines.data?.items ?? []).map((row) => (
                        <tr key={row.lineId} className="border-t border-border/70">
                          <td className="px-3 py-2.5">
                            <Link
                              href={`${ecommerceAdminRoutes.orders}?order=${row.orderId}`}
                              className="font-medium text-primary hover:underline"
                              dir="ltr"
                            >
                              {row.orderNumber}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground" dir="ltr">
                            {new Date(row.orderCreatedAt).toLocaleString('ar-YE')}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="subtle">
                              {ORDER_STATUS_LABELS_AR[row.status] ?? row.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {PAYMENT_METHOD_LABELS_AR[row.paymentMethod]} ·{' '}
                            {PAYMENT_STATUS_LABELS_AR[row.paymentStatus]}
                          </td>
                          <td className="px-3 py-2.5">{row.customerNameAr || '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{row.shipCity || '—'}</td>
                          <td className="px-3 py-2.5">{row.productName}</td>
                          <td className="px-3 py-2.5 tabular-nums">{row.quantity}</td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {money(row.lineTotalAmount, row.currencyCode || currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(lines.data?.pagination.totalPages ?? 1) > 1 ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    صفحة {linesPage} من {lines.data?.pagination.totalPages ?? 1}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={linesPage <= 1 || lines.isFetching}
                      onClick={() => setLinesPage((p) => Math.max(1, p - 1))}
                    >
                      السابق
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        linesPage >= (lines.data?.pagination.totalPages ?? 1) || lines.isFetching
                      }
                      onClick={() => setLinesPage((p) => p + 1)}
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}


function KpiCard(props: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  loading?: boolean;
  tone?: 'default' | 'warn';
}) {
  const Icon = props.icon;
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-4',
        props.tone === 'warn' && 'border-amber-500/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">{props.label}</p>
        <span className="rounded-lg bg-muted p-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      {props.loading ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded bg-muted/50" />
      ) : (
        <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight text-foreground">
          {props.value}
        </p>
      )}
      {props.hint ? <p className="mt-1 text-[11px] text-muted-foreground">{props.hint}</p> : null}
    </div>
  );
}

function SimpleTable(props: {
  title: string;
  loading?: boolean;
  empty: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{props.title}</h2>
      {props.loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : props.rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{props.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                {props.headers.map((header) => (
                  <th key={header} className="px-2 py-2 text-start font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row, index) => (
                <tr key={index} className="border-t border-border/60">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        'px-2 py-2',
                        cellIndex === 0 ? 'font-medium text-foreground' : 'tabular-nums text-muted-foreground',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      لا بيانات للرسم في هذه الفترة.
    </div>
  );
}
