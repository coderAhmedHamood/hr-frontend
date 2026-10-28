import type { ListColumnOption } from '@/components/ui/list-columns-picker';
import {
  dateListGroupOptions,
  type ListGroupMeasure,
  type ListGroupOption,
  type ListTotals,
} from '@/components/ui/list-group';
import type { ListSortOption } from '@/components/ui/list-sort';
import type { RegisterExportColumn } from '@/components/pdf/lib/register-export-rows';
import {
  ORDER_STATUS_LABELS_AR,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
} from '@/features/ecommerce/domain/constants/order-status';
import type { Order } from '@/features/ecommerce/domain/types/order';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { formatDisplayDate } from '@/shared/utils';

/**
 * The store orders list's sort, grouping and columns (list-screens skill).
 * Keys are the server's (`STORE_ORDERS_SORT` / `STORE_ORDERS_GROUP`).
 */
export const ORDERS_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'createdAt', label: 'التاريخ' },
  { key: 'orderNumber', label: 'رقم الطلب' },
  { key: 'customer', label: 'العميل' },
  { key: 'city', label: 'المدينة' },
  { key: 'total', label: 'الإجمالي' },
  { key: 'status', label: 'الحالة' },
  { key: 'paymentStatus', label: 'حالة الدفع' },
];

export const ORDER_SOURCE_LABELS_AR: Record<string, string> = {
  storefront: 'المتجر',
  seed: 'يدوي / تجريبي',
};

const label = (labels: Record<string, string>) => (key: string) => labels[key] ?? key;

export const ORDERS_GROUP_OPTIONS: readonly ListGroupOption[] = [
  { key: 'status', label: 'الحالة', formatKey: label(ORDER_STATUS_LABELS_AR) },
  { key: 'paymentStatus', label: 'حالة الدفع', formatKey: label(PAYMENT_STATUS_LABELS_AR) },
  { key: 'paymentMethod', label: 'طريقة الدفع', formatKey: label(PAYMENT_METHOD_LABELS_AR) },
  { key: 'city', label: 'المدينة', emptyLabel: 'بدون مدينة' },
  { key: 'assignee', label: 'المسؤول', emptyLabel: 'غير مسند' },
  { key: 'source', label: 'المصدر', formatKey: label(ORDER_SOURCE_LABELS_AR) },
  ...dateListGroupOptions(),
];

export const ORDERS_GROUP_MEASURES: readonly ListGroupMeasure[] = [{ key: 'total', label: 'الإجمالي' }];

/** Columns the user may hide (the order, customer, status and total always show). */
export const ORDERS_COLUMN_OPTIONS: readonly ListColumnOption[] = [
  { key: 'date', label: 'التاريخ' },
  { key: 'assignee', label: 'المسؤول' },
  { key: 'payment', label: 'الدفع' },
  { key: 'delivery', label: 'التوصيل' },
  { key: 'items', label: 'العناصر' },
  { key: 'fulfilment', label: 'التجهيز' },
];

/**
 * A total of orders' amounts. Orders of a group may be in more than one
 * currency (the store's currency changed): those are never added together.
 */
export function ordersTotalLabel(totals: ListTotals, currency: string): string {
  if ((totals.sums.currencies ?? 0) > 1) return 'عملات متعددة';
  return formatPrice({ amount: totals.sums.total ?? 0, currency });
}

/** From the row's line counts (the list carries no lines). */
export function orderFulfilmentLabel(order: Order): string {
  const lines = order.lineCount ?? 0;
  const shipped = order.shippedLineCount ?? 0;
  if (lines === 0 || shipped === 0) return 'لم يُجهز';
  return shipped === lines ? 'تم التجهيز' : 'تجهيز جزئي';
}

/** The printed / Excel register of orders; `key` ties a column to the screen's. */
export function ordersExportColumns(currency: string): RegisterExportColumn<Order>[] {
  return [
    { label: 'رقم الطلب', kind: 'code', value: (o) => o.orderNumber },
    { key: 'date', label: 'التاريخ', kind: 'date', value: (o) => formatDisplayDate(o.createdAt) },
    { label: 'العميل', kind: 'name', value: (o) => o.customerNameAr },
    { label: 'الهاتف', kind: 'code', value: (o) => o.phone ?? '' },
    { key: 'delivery', label: 'المدينة', kind: 'text', value: (o) => [o.city, o.region].filter(Boolean).join(' — ') },
    { label: 'الحالة', kind: 'status', value: (o) => ORDER_STATUS_LABELS_AR[o.status] ?? o.status },
    { key: 'assignee', label: 'المسؤول', kind: 'text', value: (o) => o.assignedUserName ?? 'غير مسند' },
    {
      key: 'payment',
      label: 'طريقة الدفع',
      kind: 'status',
      value: (o) => (o.paymentMethod ? (PAYMENT_METHOD_LABELS_AR[o.paymentMethod] ?? o.paymentMethod) : ''),
    },
    {
      key: 'payment',
      label: 'حالة الدفع',
      kind: 'status',
      value: (o) => PAYMENT_STATUS_LABELS_AR[o.paymentStatus ?? 'pending'] ?? '',
    },
    { key: 'fulfilment', label: 'التجهيز', kind: 'status', value: orderFulfilmentLabel },
    { key: 'items', label: 'القطع', kind: 'number', value: (o) => String(o.itemQuantity ?? '') },
    {
      label: 'الإجمالي',
      kind: 'number',
      value: (o) => formatPrice(o.totalAmount),
      total: (t) => ordersTotalLabel(t, currency),
    },
  ];
}
