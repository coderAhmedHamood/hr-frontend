'use client';

import * as React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Can } from '@/components/shared/can';
import { OrderDetailPanel } from '@/features/ecommerce/admin/orders/components/order-detail-panel';
import { OrderStatusHistoryButton } from '@/features/ecommerce/admin/orders/components/order-status-history-button';
import {
  useOrderDetail,
  useOrdersList,
} from '@/features/ecommerce/admin/orders/hooks/use-orders';
import {
  ORDER_STATUS_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
} from '@/features/ecommerce/domain/constants/order-status';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { storeOrdersHttpEnabled } from '@/features/ecommerce/shared/lib/api/store-orders-api';
import { cn } from '@/shared/utils';

const ORDERS_READ_PERMISSION = 'sta.orders.read';

type Props = {
  companyId: string;
  partnerId: string;
};

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-YE', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function PartnerStoreOrdersBody({ companyId, partnerId }: Props) {
  const enabled = storeOrdersHttpEnabled();
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const { data, isLoading, isError } = useOrdersList(
    {
      companyId,
      partnerId,
      page: 1,
      limit: 20,
    },
    enabled && Boolean(companyId && partnerId),
  );
  const detailQuery = useOrderDetail(companyId, selectedOrderId);

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        طلبات المتجر غير متاحة حالياً (STORE_HTTP معطّل).
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">جاري تحميل الطلبات…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        تعذر تحميل طلبات المتجر. تأكد من صلاحية <span dir="ltr">sta.orders.read</span>.
      </p>
    );
  }

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? items.length;

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">لا توجد طلبات متجر مرتبطة بهذه الجهة.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {total} طلب{total === 1 ? '' : 'ات'}
      </p>

      <ul className="divide-y divide-border rounded-2xl border border-border/70 bg-background">
        {items.map((order) => {
          const selected = selectedOrderId === order.id;
          return (
            <li key={order.id}>
              <div
                className={cn(
                  'flex items-stretch gap-1 px-1 py-1 transition-colors hover:bg-muted/40',
                  selected && 'bg-muted/50',
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className="flex min-w-0 flex-1 flex-col gap-2 px-2 py-2 text-start sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground" dir="ltr">
                        {order.orderNumber}
                      </span>
                      <Badge variant="secondary">{ORDER_STATUS_LABELS_AR[order.status]}</Badge>
                      <Badge variant="outline">
                        {PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending']}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatShortDate(order.createdAt)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatPrice(order.totalAmount)}
                  </p>
                </button>
                <div className="flex shrink-0 items-center pe-1">
                  <OrderStatusHistoryButton
                    companyId={companyId}
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    history={order.statusHistory}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <OrderDetailPanel
        companyId={companyId}
        order={detailQuery.data ?? null}
        orderId={selectedOrderId}
        loading={detailQuery.isLoading || detailQuery.isFetching}
        open={Boolean(selectedOrderId)}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null);
        }}
      />
    </div>
  );
}

export function PartnerStoreOrdersPanel({ companyId, partnerId }: Props) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
      <header className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">طلبات المتجر</h2>
          <p className="text-xs text-muted-foreground">
            طلبات المتجر المرتبطة بهذه الجهة عبر <span dir="ltr">partner_id</span>.
          </p>
        </div>
      </header>

      <Can
        permission={ORDERS_READ_PERMISSION}
        fallback={
          <p className="text-sm text-muted-foreground">
            لا تملك صلاحية عرض طلبات المتجر (
            <span dir="ltr">sta.orders.read</span>).
          </p>
        }
      >
        <PartnerStoreOrdersBody companyId={companyId} partnerId={partnerId} />
      </Can>
    </section>
  );
}
