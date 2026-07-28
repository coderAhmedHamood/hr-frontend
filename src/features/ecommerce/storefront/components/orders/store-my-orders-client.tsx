'use client';

import * as React from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronLeft, Package, PackageSearch, Search } from 'lucide-react';
import { getStorefrontOrdersByNumbers } from '@/features/ecommerce/storefront/lib/checkout-actions';
import { listRememberedStorefrontOrderNumbers } from '@/features/ecommerce/storefront/lib/order-history';
import type { StorefrontCustomerOrder } from '@/features/ecommerce/storefront/domain/checkout';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

export function StoreMyOrdersClient() {
  const t = useTranslations('storefront');
  const format = useFormatter();
  const router = useRouter();
  const [orders, setOrders] = React.useState<StorefrontCustomerOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [orderNumber, setOrderNumber] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const numbers = listRememberedStorefrontOrderNumbers();
        const next = numbers.length > 0 ? await getStorefrontOrdersByNumbers(numbers) : [];
        if (!cancelled) setOrders(next);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function trackOrder(event: React.FormEvent) {
    event.preventDefault();
    const value = orderNumber.trim();
    if (!value) return;
    router.push(`/store/orders/${encodeURIComponent(value)}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={trackOrder}>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="my-orders-lookup">{t('orders.lookupLabel')}</Label>
            <Input
              id="my-orders-lookup"
              dir="ltr"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ND-XXXX"
              className="font-mono"
            />
          </div>
          <Button type="submit" className="h-10 sm:mt-7 sm:self-start">
            <Search className="me-1.5 h-4 w-4" />
            {t('account.trackAction')}
          </Button>
        </form>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : orders.length === 0 ? (
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
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/store/orders/${order.orderNumber}`}
                prefetch={false}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft',
                  'transition-colors hover:border-primary/40 hover:bg-muted/20',
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold tracking-wide text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format.dateTime(new Date(order.createdAt), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {' · '}
                    {order.lines.length} {t('orders.itemsCount')}
                  </p>
                  <p className="mt-1 text-xs font-medium text-primary">
                    {t(`orders.status.${order.status}`)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="text-sm font-semibold">
                    {format.number(order.total.amount, {
                      style: 'currency',
                      currency: order.total.currency,
                    })}
                  </p>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
