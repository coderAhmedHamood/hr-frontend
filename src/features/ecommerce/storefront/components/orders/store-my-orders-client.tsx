'use client';

import * as React from 'react';
import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronLeft, PackageSearch } from 'lucide-react';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import type {
  StorefrontCustomerOrder,
  StorefrontOrderStatus,
  StorefrontPaymentStatus,
} from '@/features/ecommerce/storefront/domain/checkout';
import { storefrontOrdersRepository } from '@/features/ecommerce/storefront/lib/repositories/storefront-orders-repository';
import { storeLoginHref } from '@/features/ecommerce/storefront/lib/store-auth-return';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

const ORDER_STATUS_TONE: Record<StorefrontOrderStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  confirmed: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  processing: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  shipped: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300',
  delivered: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  cancelled: 'bg-rose-500/15 text-rose-800 dark:text-rose-300',
};

const PAYMENT_STATUS_TONE: Record<StorefrontPaymentStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  failed: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  refunded: 'bg-muted text-muted-foreground',
};

function orderStatusLabel(
  t: (key: string) => string,
  status: string,
): string {
  return t(`orders.status.${status}`);
}

/**
 * Signed-in partner order history — GET /public/store/orders.
 * Guests are redirected to login.
 */
export function StoreMyOrdersClient() {
  const t = useTranslations('storefront');
  const format = useFormatter();
  const router = useRouter();
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);
  const [hydrated, setHydrated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<StorefrontCustomerOrder[]>([]);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!customer || !accessToken) {
      router.replace(storeLoginHref('/store/orders'));
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const items = await storefrontOrdersRepository.listForPartner(accessToken);
        if (!cancelled) setOrders(items);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, customer, accessToken, router]);

  if (!hydrated || !customer || !accessToken) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <StoreEmptyState
        icon={PackageSearch}
        title={t('orders.emptyTitle')}
        description={t('orders.emptyDescription')}
      >
        <Button asChild>
          <Link href="/store/products" prefetch={false}>
            {t('cart.continueShopping')}
          </Link>
        </Button>
      </StoreEmptyState>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => {
        const thumb = order.lines[0]?.imageUrl;
        const firstProduct = order.lines[0]?.productName;
        const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0) || order.lines.length;
        const placedAt = format.dateTime(new Date(order.createdAt), {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const total = format.number(order.total.amount, {
          style: 'currency',
          currency: order.total.currency,
        });
        const status = (order.status || 'pending') as StorefrontOrderStatus;
        const paymentStatus = (order.paymentStatus || 'pending') as StorefrontPaymentStatus;
        const city = order.address?.city?.trim();

        return (
          <li key={order.id}>
            <Link
              href={`/store/orders/${encodeURIComponent(order.orderNumber)}`}
              prefetch={false}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft',
                'transition-colors hover:border-primary/30 hover:bg-muted/20',
              )}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {thumb ? (
                  <Image src={thumb} alt="" fill className="object-cover" sizes="64px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <PackageSearch className="h-6 w-6" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-semibold tracking-wide text-foreground">
                    {order.orderNumber}
                  </p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      ORDER_STATUS_TONE[status] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {orderStatusLabel(t, status)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      PAYMENT_STATUS_TONE[paymentStatus] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {t(`orders.paymentStatus.${paymentStatus}`)}
                  </span>
                </div>

                {firstProduct ? (
                  <p className="truncate text-sm text-foreground">
                    {firstProduct}
                    {order.lines.length > 1
                      ? ` +${order.lines.length - 1} ${t('orders.moreItems')}`
                      : null}
                  </p>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  {t('orders.placedAt', { date: placedAt })}
                  {city ? ` · ${city}` : null}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {itemCount} {t('orders.itemsCount')} ·{' '}
                    <span className="font-semibold tabular-nums text-foreground">{total}</span>
                  </span>
                  <span>
                    {t('orders.paymentMethodLabel')}:{' '}
                    {t(`checkout.paymentMethods.${order.paymentMethod}.label`)}
                  </span>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
