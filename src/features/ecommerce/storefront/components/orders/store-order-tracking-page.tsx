'use client';

import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import {
  Check,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import type {
  StorefrontCustomerOrder,
  StorefrontOrderStatus,
} from '@/features/ecommerce/storefront/domain/checkout';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type Props = {
  order: StorefrontCustomerOrder;
};

const TRACKING_STEPS: Array<{
  status: StorefrontOrderStatus;
  icon: typeof Check;
}> = [
  { status: 'confirmed', icon: Check },
  { status: 'processing', icon: Package },
  { status: 'shipped', icon: Truck },
  { status: 'delivered', icon: PackageCheck },
];

function trackingIndex(status: StorefrontOrderStatus): number {
  if (status === 'pending') return 0;
  if (status === 'cancelled') return -1;
  const index = TRACKING_STEPS.findIndex((step) => step.status === status);
  return index === -1 ? 0 : index;
}

export function StoreOrderTrackingPage({ order }: Props) {
  const t = useTranslations('storefront');
  const format = useFormatter();

  const currentIdx = trackingIndex(order.status);
  const currency = order.total.currency;
  const progressPercent =
    currentIdx <= 0 ? 8 : Math.min(100, (currentIdx / (TRACKING_STEPS.length - 1)) * 100);

  function formatPrice(amount: number) {
    return format.number(amount, { style: 'currency', currency });
  }

  const orderPath = `/store/orders/${order.orderNumber}` as const;
  const placedAt = format.dateTime(new Date(order.createdAt), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const eta = format.dateTime(new Date(order.estimatedDeliveryAt), { dateStyle: 'medium' });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('orders.trackingTitle'), path: orderPath },
        ]}
      />

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="bg-gradient-to-br from-primary/12 via-card to-secondary/10 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('orders.orderNumber')}
              </p>
              <h1 className="mt-1 font-arabic-display text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
                {order.orderNumber}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('orders.placedAt', { date: placedAt })}
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-background/80 px-4 py-3 backdrop-blur">
              <p className="text-[11px] text-muted-foreground">{t('orders.currentStatus')}</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">
                {t(`orders.status.${order.status}`)}
              </p>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            {t('orders.eta', { date: eta })}
          </div>
        </div>

        <div className="border-t border-border px-5 py-6 sm:px-8">
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute start-[14px] top-3 bottom-3 w-px bg-border sm:start-0 sm:end-0 sm:top-5 sm:bottom-auto sm:h-0.5 sm:w-full" />
            <div
              className="absolute start-[14px] top-3 w-px bg-primary sm:start-0 sm:top-5 sm:h-0.5 sm:w-[var(--progress)]"
              style={{ ['--progress' as string]: `${progressPercent}%` }}
            />

            <ol className="relative grid gap-6 sm:grid-cols-4 sm:gap-2">
              {TRACKING_STEPS.map(({ status, icon: Icon }, index) => {
                const done = currentIdx >= index;
                const active = currentIdx === index;
                return (
                  <li key={status} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                    <span
                      className={cn(
                        'relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-card sm:h-10 sm:w-10',
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground',
                        active && 'ring-4 ring-primary/15',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <div className="min-w-0 pt-0.5 sm:pt-2">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          done ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {t(`orders.status.${status}`)}
                      </p>
                      {active ? (
                        <p className="mt-0.5 text-xs text-primary">{t('orders.statusNow')}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h2 className="font-arabic-display text-base font-semibold">{t('orders.items')}</h2>
            <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {order.lines.length}
            </span>
          </div>
          <ul className="space-y-3">
            {order.lines.map((line) => (
              <li
                key={`${line.productId}-${line.variantId ?? 'base'}`}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/15 p-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-background">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/store/products/${line.productSlug}`}
                    prefetch={false}
                    className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                  >
                    {line.productName}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('cart.quantity')}: {line.quantity} · {formatPrice(line.unitPrice.amount)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">{formatPrice(line.lineTotal.amount)}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">{t('orders.shippingAddress')}</h2>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{order.address.fullName}</p>
              <p className="text-muted-foreground" dir="ltr">
                {order.address.phone}
              </p>
              <p className="text-muted-foreground">
                {order.address.city} · {order.address.district}
              </p>
              <p className="text-muted-foreground">{order.address.street}</p>
              {order.address.notes ? (
                <p className="mt-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {order.address.notes}
                </p>
              ) : null}
              {order.customerNote ? (
                <p className="mt-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {order.customerNote}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">{t('orders.payment')}</h2>
            </div>
            <p className="text-sm font-medium">
              {t(`checkout.paymentMethods.${order.paymentMethod}.label`)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(`orders.paymentStatus.${order.paymentStatus}`)}
            </p>

            <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('cart.subtotal')}</dt>
                <dd>{formatPrice(order.subtotal.amount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('checkout.shipping')}</dt>
                <dd>
                  {order.shippingFee.amount === 0
                    ? t('checkout.freeShipping')
                    : formatPrice(order.shippingFee.amount)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3 text-base font-semibold">
                <dt>{t('cart.total')}</dt>
                <dd>{formatPrice(order.total.amount)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/store/products"
          prefetch={false}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          {t('cart.continueShopping')}
        </Link>
        <Link
          href="/store/account"
          prefetch={false}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium"
        >
          {t('orders.myAccount')}
        </Link>
      </div>
    </div>
  );
}
