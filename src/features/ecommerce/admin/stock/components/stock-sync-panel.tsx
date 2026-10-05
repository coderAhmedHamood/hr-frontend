'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Can } from '@/components/shared/can';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { useCan } from '@/features/auth/hooks/use-can';
import { useHeaderExtrasBridge } from '@/features/ecommerce/admin/cms/settings/lib/use-header-extras-bridge';
import {
  stockSyncApi,
  type StockSyncRun,
} from '@/features/ecommerce/admin/stock/lib/api/stock-sync-api';
import { handleApiError } from '@/shared/api/global-error-handler';
import { cn } from '@/shared/utils';

const READ = 'sta.stock.read';
const UPDATE = 'sta.stock.update';

const KIND_LABEL: Record<StockSyncRun['kind'], string> = {
  enable: 'عند تفعيل الربط',
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
 * Store ↔ inventory reconciliation (phase 4). With the link (store-stock-sync)
 * the store sells from inventory: orders reserve, shipping issues. The report
 * compares the store's previous own quantity with what inventory has
 * available, and running it sets the store's availability from inventory.
 */
export function StockSyncPanel({
  companyId,
  onHeaderExtrasChange,
}: {
  companyId: string;
  onHeaderExtrasChange?: (node: React.ReactNode | null) => void;
}) {
  const can = useCan();
  const queryClient = useQueryClient();
  const queryKey = ['ecommerce', 'stock-sync', companyId];
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => stockSyncApi.list(companyId),
    enabled: Boolean(companyId) && can(READ),
  });
  const run = useMutation({
    mutationFn: () => stockSyncApi.run(companyId),
    onSuccess: () => {
      toast.success('تمت المطابقة وضُبطت حالة التوفر من المخازن');
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      handleApiError(error, 'ecommerce.stock-sync.run');
    },
  });

  const enabled = data?.enabled ?? false;
  const canRun = enabled && can(UPDATE);
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

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const runs = data?.runs ?? [];
  const selected = runs.find((r) => r.id === selectedId) ?? runs[0] ?? null;

  return (
    <Can
      permission={READ}
      fallback={<p className="text-sm text-muted-foreground">لا تملك صلاحية عرض كميات المتجر.</p>}
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
      ) : isError ? (
        <button type="button" className="text-sm text-destructive underline" onClick={() => void refetch()}>
          تعذّر التحميل — أعد المحاولة
        </button>
      ) : (
        <div className="space-y-4">
          <div
            className={cn(
              'rounded-xl border px-3.5 py-2.5 text-sm',
              enabled
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-border bg-muted/40 text-muted-foreground',
            )}
          >
            {enabled
              ? 'المتجر يبيع من المخازن: الطلب يحجز الكمية عند إنشائه، ويُصرف من المستودع عند الشحن، ويُحرَّر الحجز عند الإلغاء.'
              : 'ربط المتجر بالمخازن غير مفعّل لهذه الشركة: المتجر يبيع من كميته الخاصة (في صفحة المنتج).'}
          </div>

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
        </div>
      )}
    </Can>
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
          {openLocalOrders} طلب مفتوح خُصم من كمية المتجر قبل الربط: إن أُلغي يعود لكمية المتجر، وعند شحنه لا يُصرف من المخازن.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">الصنف</th>
              <th className="px-3 py-2 text-start font-medium">كمية المتجر السابقة</th>
              <th className="px-3 py-2 text-start font-medium">الرصيد</th>
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
                  {!item.tracked ? (
                    <span className="ms-2 text-xs text-muted-foreground">(غير متتبَّع)</span>
                  ) : null}
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
