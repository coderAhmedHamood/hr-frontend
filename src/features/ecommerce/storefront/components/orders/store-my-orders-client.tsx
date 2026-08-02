'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { PackageSearch, Search } from 'lucide-react';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';

/**
 * Guest order lookup — orderNumber + phone only (binding).
 * No localStorage order history list.
 */
export function StoreMyOrdersClient() {
  const t = useTranslations('storefront');
  const router = useRouter();
  const [orderNumber, setOrderNumber] = React.useState('');
  const [phone, setPhone] = React.useState('');

  function trackOrder(event: React.FormEvent) {
    event.preventDefault();
    const value = orderNumber.trim();
    const phoneValue = phone.trim();
    if (!value || !phoneValue) return;
    const params = new URLSearchParams({ phone: phoneValue });
    router.push(`/store/orders/${encodeURIComponent(value)}?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" onSubmit={trackOrder}>
          <div className="min-w-0 flex-1 space-y-1.5 sm:min-w-[12rem]">
            <Label htmlFor="my-orders-lookup">{t('orders.lookupLabel')}</Label>
            <Input
              id="my-orders-lookup"
              dir="ltr"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ST-XXXX"
              className="font-mono"
              required
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5 sm:min-w-[12rem]">
            <Label htmlFor="my-orders-phone">{t('orders.lookupPhone')}</Label>
            <Input
              id="my-orders-phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('orders.lookupPhonePlaceholder')}
              required
            />
          </div>
          <Button type="submit" className="h-10 sm:mt-7 sm:self-start">
            <Search className="me-1.5 h-4 w-4" />
            {t('account.trackAction')}
          </Button>
        </form>
      </section>

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
    </div>
  );
}
