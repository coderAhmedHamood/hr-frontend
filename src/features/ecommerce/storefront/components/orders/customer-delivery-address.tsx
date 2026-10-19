'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Pencil } from 'lucide-react';
import { updatePublicStoreOrderAddress } from '@/features/ecommerce/shared/lib/api/store-orders-api';
import type { StorefrontCustomerOrder } from '@/features/ecommerce/storefront/domain/checkout';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { StoreHttpError } from '@/features/ecommerce/storefront/lib/api/store-http';

const EDITABLE_STATUSES = new Set(['pending', 'confirmed', 'processing']);

type Props = {
  order: StorefrontCustomerOrder;
  /** Guest tracking phone, when the page was opened with `?phone=`. */
  phone?: string | null;
  onUpdated: (order: StorefrontCustomerOrder) => void;
};

/** The customer corrects the delivery address, and only before the order ships. */
export function CustomerDeliveryAddress({ order, phone, onUpdated }: Props) {
  const t = useTranslations('storefront');
  const accessToken = useStorefrontCustomerUi((state) => state.accessToken);
  const canEdit = EDITABLE_STATUSES.has(order.status);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => fieldsOf(order));

  function open() {
    setForm(fieldsOf(order));
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (pending) return;
    const shipFullName = form.fullName.trim();
    const shipPhone = form.phone.trim();
    const shipDistrict = form.district.trim();
    const shipStreet = form.street.trim();
    if (!shipFullName || !shipPhone || !shipDistrict || !shipStreet) {
      setError(t('checkout.errors.addressIncomplete'));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const next = await updatePublicStoreOrderAddress({
        companyId: order.companyId,
        orderNumber: order.orderNumber,
        phone,
        partnerToken: accessToken,
        shipFullName,
        shipPhone,
        shipDistrict,
        shipStreet,
        shipNotes: form.notes.trim() || null,
      });
      onUpdated(next);
      setEditing(false);
    } catch (caught) {
      setError(
        caught instanceof StoreHttpError && caught.message
          ? caught.message
          : t('checkout.checkFailed'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{t('orders.shippingAddress')}</h2>
        {canEdit && !editing ? (
          <button
            type="button"
            onClick={open}
            className="ms-auto inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Pencil className="h-3 w-3" />
            {t('orders.editAddress')}
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t('orders.addressBeforeShip')}</p>
          <p className="text-xs text-muted-foreground">{t('orders.cityUnchanged')}</p>
          <Field
            label={t('checkout.fullName')}
            value={form.fullName}
            onChange={(fullName) => setForm((current) => ({ ...current, fullName }))}
          />
          <Field
            label={t('checkout.phone')}
            value={form.phone}
            dir="ltr"
            onChange={(phone) => setForm((current) => ({ ...current, phone }))}
          />
          <p className="text-sm text-muted-foreground">
            {t('checkout.city')}: {order.address.city}
          </p>
          <Field
            label={t('checkout.district')}
            value={form.district}
            onChange={(district) => setForm((current) => ({ ...current, district }))}
          />
          <Field
            label={t('checkout.street')}
            value={form.street}
            onChange={(street) => setForm((current) => ({ ...current, street }))}
          />
          <Field
            label={t('orders.addressNotes')}
            value={form.notes}
            onChange={(notes) => setForm((current) => ({ ...current, notes }))}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t('orders.cancelEdit')}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void save()}
              className="rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {pending ? t('orders.saving') : t('orders.saveAddress')}
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </section>
  );
}

function fieldsOf(order: StorefrontCustomerOrder) {
  return {
    fullName: order.address.fullName,
    phone: order.address.phone,
    district: order.address.district,
    street: order.address.street,
    notes: order.address.notes ?? '',
  };
}

function Field({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'ltr';
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
      />
    </label>
  );
}
