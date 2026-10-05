'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Can } from '@/components/shared/can';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCan } from '@/features/auth/hooks/use-can';
import { useHeaderExtrasBridge } from '@/features/ecommerce/admin/cms/settings/lib/use-header-extras-bridge';
import {
  stockSyncApi,
  stockSyncStatusApi,
  type StockSyncRun,
  type StockSyncStatus,
} from '@/features/ecommerce/admin/stock/lib/api/stock-sync-api';
import { storeStockOpeningApi } from '@/features/ecommerce/admin/stock/lib/api/store-stock-api';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { handleApiError } from '@/shared/api/global-error-handler';
import { cn } from '@/shared/utils';

const READ = 'sta.stock.read';
const UPDATE = 'sta.stock.update';

const KIND_LABEL: Record<string, string> = {
  enable: 'عند تفعيل الربط',
  disable: 'عند تعطيل الربط',
  manual: 'يدوي',
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

const qty = (n: number | null) => (n === null ? '—' : Number(n.toFixed(4)).toString());

/**
 * The store–inventory link (phase 4): the store's warehouse, draining before
 * disabling, the open work (reservation shortfalls, older orders to review),
 * the local opening after the link is disabled, and the reconciliation
 * reports.
 */
export function StockSyncPanel({
  companyId,
  onHeaderExtrasChange,
}: {
  companyId: string;
  onHeaderExtrasChange?: (node: React.ReactNode | null) => void;
}) {
  const can = useCan();
  const canUpdate = can(UPDATE);
  const queryClient = useQueryClient();
  const statusKey = ['ecommerce', 'stock-sync', 'status', companyId];
  const runsKey = ['ecommerce', 'stock-sync', 'runs', companyId];
  const status = useQuery({
    queryKey: statusKey,
    queryFn: () => stockSyncStatusApi.get(companyId),
    enabled: Boolean(companyId) && can(READ),
  });
  const runs = useQuery({
    queryKey: runsKey,
    queryFn: () => stockSyncApi.list(companyId),
    enabled: Boolean(companyId) && can(READ),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: statusKey });
    void queryClient.invalidateQueries({ queryKey: runsKey });
  };
  const onError = (error: unknown) => {
    handleApiError(error, 'ecommerce.stock-sync');
  };
  const run = useMutation({
    mutationFn: () => stockSyncApi.run(companyId),
    onSuccess: () => {
      toast.success('تمت المطابقة وضُبطت حالة التوفر من مستودع المتجر');
      refresh();
    },
    onError,
  });

  const s = status.data;
  const canRun = Boolean(s?.enabled && s.warehouseId) && canUpdate;
  useHeaderExtrasBridge(
    onHeaderExtrasChange,
    () =>
      canRun ? (
        <PageHeaderPrimaryButton
          icon={RefreshCw}
          label={run.isPending ? 'جارٍ المطابقة…' : 'مطابقة الآن'}
          className="h-10 px-3.5 text-sm"
          disabled={run.isPending}
          onClick={() => run.mutate()}
        />
      ) : null,
    [canRun, run.isPending, onHeaderExtrasChange],
  );

  return (
    <Can
      permission={READ}
      fallback={<p className="text-sm text-muted-foreground">لا تملك صلاحية عرض كميات المتجر.</p>}
    >
      {status.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
      ) : status.isError || !s ? (
        <button type="button" className="text-sm text-destructive underline" onClick={() => void status.refetch()}>
          تعذّر التحميل — أعد المحاولة
        </button>
      ) : (
        <div className="space-y-5">
          <StatusBanner status={s} />
          {s.enabled ? (
            <>
              <WarehouseSetting
                companyId={companyId}
                status={s}
                canUpdate={canUpdate}
                onDone={refresh}
                onError={onError}
              />
              <DrainControl
                companyId={companyId}
                status={s}
                canUpdate={canUpdate}
                onDone={refresh}
                onError={onError}
              />
              <Shortfalls status={s} />
            </>
          ) : null}
          <UnresolvedOrders status={s} />
          {!s.enabled && s.localState === 'needs_opening' ? (
            <LocalOpening
              companyId={companyId}
              canUpdate={canUpdate}
              runs={runs.data?.runs ?? []}
              onDone={refresh}
              onError={onError}
            />
          ) : null}
          <Reports runs={runs.data?.runs ?? []} />
        </div>
      )}
    </Can>
  );
}

function StatusBanner({ status: s }: { status: StockSyncStatus }) {
  const tone = !s.enabled
    ? 'border-border bg-muted/40 text-muted-foreground'
    : s.needsWarehouse || s.state === 'draining'
      ? 'border-warning/30 bg-warning/10 text-warning'
      : 'border-success/30 bg-success/10 text-success';
  const text = !s.enabled
    ? s.localState === 'needs_opening'
      ? 'الربط معطّل. البيع من كمية المتجر متوقف للأصناف المتتبَّعة حتى تُعتمد الكميات الافتتاحية أدناه.'
      : 'ربط المتجر بالمخازن غير مفعّل: المتجر يبيع من كميته الخاصة (في صفحة المنتج).'
    : s.needsWarehouse
      ? 'الربط مفعّل لكن مستودع المتجر غير محدد: الطلبات مرفوضة حتى تختاره.'
      : s.state === 'draining'
        ? 'قيد التصريف: الطلبات الجديدة متوقفة. اشحن الطلبات المفتوحة أو ألغها ثم عطّل الربط من إدارة التطبيقات.'
        : `المتجر يبيع من مستودع «${s.warehouseNameAr ?? '—'}»: يُحجز عند الطلب ويُصرف عند الشحن.`;
  return <div className={cn('rounded-xl border px-3.5 py-2.5 text-sm', tone)}>{text}</div>;
}

function WarehouseSetting({
  companyId,
  status: s,
  canUpdate,
  onDone,
  onError,
}: {
  companyId: string;
  status: StockSyncStatus;
  canUpdate: boolean;
  onDone: () => void;
  onError: (e: unknown) => void;
}) {
  const [value, setValue] = React.useState(s.warehouseId ?? '');
  React.useEffect(() => setValue(s.warehouseId ?? ''), [s.warehouseId]);
  const save = useMutation({
    mutationFn: () => stockSyncStatusApi.setWarehouse(companyId, value),
    onSuccess: () => {
      toast.success('تم حفظ مستودع المتجر');
      onDone();
    },
    onError,
  });
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">مستودع المتجر</h3>
      <p className="text-xs text-muted-foreground">
        مستودع واحد يخدم المتجر: منه الحجز والتجهيز والصرف والتوفر المعروض. لا يتغير وفيه حجوزات مفتوحة.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value} onValueChange={setValue} disabled={!canUpdate || save.isPending}>
          <SelectTrigger className="h-10 w-64" aria-label="مستودع المتجر">
            <SelectValue placeholder="اختر المستودع" />
          </SelectTrigger>
          <SelectContent>
            {s.warehouses.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.nameAr} ({w.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!canUpdate || !value || value === s.warehouseId || save.isPending}
          onClick={() => save.mutate()}
        >
          حفظ
        </Button>
      </div>
    </section>
  );
}

function DrainControl({
  companyId,
  status: s,
  canUpdate,
  onDone,
  onError,
}: {
  companyId: string;
  status: StockSyncStatus;
  canUpdate: boolean;
  onDone: () => void;
  onError: (e: unknown) => void;
}) {
  const drain = useMutation({
    mutationFn: () =>
      s.state === 'draining' ? stockSyncStatusApi.resume(companyId) : stockSyncStatusApi.drain(companyId),
    onSuccess: () => {
      toast.success(s.state === 'draining' ? 'استُؤنف البيع من المخازن' : 'بدأ التصريف: الطلبات الجديدة متوقفة');
      onDone();
    },
    onError,
  });
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">تعطيل الربط</h3>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="حجوزات مفتوحة" value={s.openReservations} />
        <Stat label="طلبات مخازن مفتوحة" value={s.openInventoryOrders} />
        <Stat label="طلبات قديمة للمراجعة" value={s.unresolvedOrders.length} warn={s.unresolvedOrders.length > 0} />
      </div>
      <p className="text-xs text-muted-foreground">
        التعطيل يمر بالتصريف: توقف الطلبات الجديدة، ثم تُشحن الطلبات المفتوحة أو تُلغى، ثم يُعطَّل الربط من إدارة التطبيقات.
        {s.state === 'draining'
          ? s.canDisable
            ? ' لا عمل مفتوحاً: يمكن التعطيل الآن.'
            : ' ما زال عمل مفتوح.'
          : ''}
      </p>
      <Button
        size="sm"
        variant={s.state === 'draining' ? 'outline' : 'destructive'}
        disabled={!canUpdate || drain.isPending}
        onClick={() => drain.mutate()}
      >
        {s.state === 'draining' ? 'إيقاف التصريف واستئناف البيع' : 'بدء التصريف'}
      </Button>
    </section>
  );
}

function Shortfalls({ status: s }: { status: StockSyncStatus }) {
  if (s.shortfalls.length === 0) return null;
  return (
    <section className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
      <h3 className="text-sm font-semibold text-destructive">عجز في الحجوزات</h3>
      <p className="text-xs text-muted-foreground">
        نقص الرصيد الصالح للبيع عن المحجوز (تلف أو جرد). هذه الطلبات لا تُجهَّز ولا تُشحن حتى يُستلم مخزون أو تُلغى.
      </p>
      <ul className="space-y-1 text-xs">
        {s.shortfalls.map((f) => (
          <li key={`${f.productId}:${f.variantId ?? ''}`}>
            المحجوز {qty(f.reserved)} · الصالح {qty(f.sellable)} · الناقص {qty(f.missing)} — الطلبات:{' '}
            <span className="font-medium">{f.uncoveredOrders.join('، ')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UnresolvedOrders({ status: s }: { status: StockSyncStatus }) {
  if (s.unresolvedOrders.length === 0) return null;
  return (
    <section className="space-y-2 rounded-xl border border-warning/30 bg-warning/5 p-3">
      <h3 className="text-sm font-semibold">طلبات قديمة تحتاج تحديد مصدر المخزون</h3>
      <p className="text-xs text-muted-foreground">
        طلبات مفتوحة بلا حركة مخزون ولا حجز. لا تُشحن قبل اختيار مصدرها من صفحة الطلب.
      </p>
      <ul className="flex flex-wrap gap-2 text-xs">
        {s.unresolvedOrders.map((o) => (
          <li key={o.id}>
            <Link
              href={`${ecommerceAdminRoutes.orders}?order=${o.id}`}
              className="rounded-md border border-border px-2 py-1 hover:bg-muted"
            >
              {o.orderNumber}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LocalOpening({
  companyId,
  canUpdate,
  runs,
  onDone,
  onError,
}: {
  companyId: string;
  canUpdate: boolean;
  runs: StockSyncRun[];
  onDone: () => void;
  onError: (e: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const key = ['ecommerce', 'stock-opening', companyId];
  const opening = useQuery({ queryKey: key, queryFn: () => storeStockOpeningApi.get(companyId) });
  const lastDisable = runs.find((r) => r.kind === 'disable');
  const reportItems = lastDisable?.report.items ?? [];
  const names = new Map(reportItems.map((i) => [`${i.productId}:${i.variantId ?? ''}`, i]));
  const levels = opening.data?.levels ?? [];
  const [values, setValues] = React.useState<Record<string, string>>({});
  const approve = useMutation({
    mutationFn: () =>
      storeStockOpeningApi.approve(
        companyId,
        levels.map((l) => {
          const k = `${l.productId}:${l.variantId ?? ''}`;
          return {
            productId: l.productId,
            variantId: l.variantId,
            quantity: Number(values[k] ?? l.quantity),
          };
        }),
      ),
    onSuccess: () => {
      toast.success('اعتُمدت الكميات الافتتاحية واستُؤنف البيع المحلي');
      void queryClient.invalidateQueries({ queryKey: key });
      onDone();
    },
    onError,
  });
  const valid = levels.every((l) => {
    const v = Number(values[`${l.productId}:${l.variantId ?? ''}`] ?? l.quantity);
    return Number.isFinite(v) && v >= 0;
  });

  return (
    <section className="space-y-2 rounded-xl border border-border p-3">
      <h3 className="text-sm font-semibold">الكميات الافتتاحية للمتجر</h3>
      <p className="text-xs text-muted-foreground">
        بعد تعطيل الربط لا تُستخدم كميات المتجر القديمة تلقائياً. راجع كل صنف مقابل المتاح في المستودع وقت التعطيل، ثم اعتمد الكمية
        الافتتاحية. الأصناف غير المعتمدة يتوقف تتبّعها.
      </p>
      {levels.length === 0 ? (
        <p className="text-xs text-muted-foreground">لا توجد كميات محلية؛ الاعتماد يستأنف البيع المحلي.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start font-medium">الصنف</th>
                <th className="px-3 py-2 text-start font-medium">الكمية القديمة</th>
                <th className="px-3 py-2 text-start font-medium">المتاح في المستودع</th>
                <th className="px-3 py-2 text-start font-medium">الافتتاحية</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((l) => {
                const k = `${l.productId}:${l.variantId ?? ''}`;
                const r = names.get(k);
                return (
                  <tr key={k} className="border-t border-border/60">
                    <td className="px-3 py-2">{r?.name || l.productId.slice(0, 8)}</td>
                    <td className="px-3 py-2 tabular-nums">{qty(l.quantity)}</td>
                    <td className="px-3 py-2 tabular-nums">{r ? qty(r.available) : '—'}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        dir="rtl"
                        className="h-8 w-24"
                        value={values[k] ?? String(l.quantity)}
                        onChange={(event) => setValues((prev) => ({ ...prev, [k]: event.target.value }))}
                        disabled={!canUpdate}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Button size="sm" disabled={!canUpdate || !valid || approve.isPending} onClick={() => approve.mutate()}>
        اعتماد الكميات واستئناف البيع المحلي
      </Button>
    </section>
  );
}

function Reports({ runs }: { runs: StockSyncRun[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = runs.find((r) => r.id === selectedId) ?? runs[0] ?? null;
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">تقارير المطابقة</h3>
      {runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد تقارير مطابقة بعد.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {runs.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs',
                  r.id === selected?.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50',
                )}
              >
                {formatDate(r.createdAt)} · {KIND_LABEL[r.kind] ?? r.kind}
              </button>
            ))}
          </div>
          {selected ? <RunReport run={selected} /> : null}
        </>
      )}
    </section>
  );
}

function RunReport({ run }: { run: StockSyncRun }) {
  const { totals, items, openLocalOrders } = run.report;
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <Stat label="الأصناف" value={totals.items} />
        <Stat label="متتبَّعة في المخازن" value={totals.tracked} />
        <Stat label="فرق مع كمية المتجر" value={totals.mismatched} warn={totals.mismatched > 0} />
        <Stat label="غير متوفرة" value={totals.outOfStock} />
      </div>
      {openLocalOrders > 0 ? (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-warning">
          {openLocalOrders} طلب مفتوح خُصم من كمية المتجر: إن أُلغي يعود لكمية المتجر، وعند شحنه لا يُصرف من المخازن.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">الصنف</th>
              <th className="px-3 py-2 text-start font-medium">كمية المتجر</th>
              <th className="px-3 py-2 text-start font-medium">الرصيد الصالح</th>
              <th className="px-3 py-2 text-start font-medium">محجوز</th>
              <th className="px-3 py-2 text-start font-medium">المتاح</th>
              <th className="px-3 py-2 text-start font-medium">الفرق</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.productId}:${item.variantId ?? ''}`} className="border-t border-border/60">
                <td className="px-3 py-2">
                  {item.name || item.productId.slice(0, 8)}
                  {!item.tracked ? <span className="ms-2 text-xs text-muted-foreground">(غير متتبَّع)</span> : null}
                </td>
                <td className="px-3 py-2 tabular-nums">{qty(item.localQuantity)}</td>
                <td className="px-3 py-2 tabular-nums">{qty(item.onHand)}</td>
                <td className="px-3 py-2 tabular-nums">{qty(item.reserved)}</td>
                <td className="px-3 py-2 tabular-nums">{qty(item.available)}</td>
                <td
                  className={cn(
                    'px-3 py-2 tabular-nums',
                    item.difference !== null && Math.abs(item.difference) > 1e-9 && 'font-medium text-warning',
                  )}
                >
                  {qty(item.difference)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums', warn && 'text-warning')}>{value}</p>
    </div>
  );
}
