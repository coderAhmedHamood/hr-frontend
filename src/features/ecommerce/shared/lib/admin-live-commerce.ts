import type { Customer } from '@/features/ecommerce/domain/types/customer';
import type { Order } from '@/features/ecommerce/domain/types/order';
import type { StorefrontCustomerOrder } from '@/features/ecommerce/storefront/domain/checkout';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';

const ORDERS_KEY = 'ecommerce-admin-live-orders';
const CUSTOMERS_KEY = 'ecommerce-admin-live-customers';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export function customerIdFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `cust-sf-${digits || 'unknown'}`;
}

export function mapStorefrontOrderToAdmin(order: StorefrontCustomerOrder): Order {
  const companyId = resolveStorefrontCompanyId(order.companyId);
  return {
    id: order.id,
    companyId,
    orderNumber: order.orderNumber,
    customerId: customerIdFromPhone(order.address.phone),
    customerNameAr: order.address.fullName,
    city: order.address.city,
    region: order.address.district,
    status: order.status === 'cancelled' ? 'cancelled' : order.status,
    items: order.lines.map((line) => ({
      productId: line.productId,
      productNameAr: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      allocations: [],
      shipStatus: 'unassigned',
      imageUrl: line.imageUrl ?? undefined,
    })),
    totalAmount: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    phone: order.address.phone,
    shippingStreet: order.address.street,
    shippingDistrict: order.address.district,
    shippingNotes: order.address.notes,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentProofUrl: order.paymentProofUrl ?? null,
    subtotalAmount: order.subtotal,
    shippingFeeAmount: order.shippingFee,
    source: 'storefront',
  };
}

export function mapStorefrontOrderToCustomer(order: StorefrontCustomerOrder): Customer {
  const now = order.createdAt;
  const phone = order.address.phone.trim();
  const digits = phone.replace(/\D/g, '');
  return {
    id: customerIdFromPhone(phone),
    companyId: resolveStorefrontCompanyId(order.companyId),
    nameAr: order.address.fullName,
    email: digits ? `${digits}@store.local` : 'guest@store.local',
    phone,
    ordersCount: 1,
    totalSpentAmount: order.total.amount,
    currency: order.total.currency,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    city: order.address.city,
    source: 'storefront',
  };
}

export function listLiveOrders(): Order[] {
  return readJson<Order>(ORDERS_KEY).map((order) => ({
    ...order,
    companyId: resolveStorefrontCompanyId(order.companyId),
  }));
}

export function listLiveCustomers(): Customer[] {
  return readJson<Customer>(CUSTOMERS_KEY).map((customer) => ({
    ...customer,
    companyId: resolveStorefrontCompanyId(customer.companyId),
  }));
}

export function upsertLiveOrder(order: Order): void {
  const existing = listLiveOrders();
  const next = [order, ...existing.filter((item) => item.id !== order.id)];
  writeJson(ORDERS_KEY, next);
}

export function upsertLiveCustomerFromOrder(order: StorefrontCustomerOrder): Customer {
  const mapped = mapStorefrontOrderToCustomer(order);
  const existing = listLiveCustomers();
  const index = existing.findIndex((item) => item.id === mapped.id);
  if (index === -1) {
    writeJson(CUSTOMERS_KEY, [mapped, ...existing]);
    return mapped;
  }

  const prev = existing[index];
  const merged: Customer = {
    ...prev,
    nameAr: mapped.nameAr,
    phone: mapped.phone,
    city: mapped.city ?? prev.city,
    ordersCount: prev.ordersCount + 1,
    totalSpentAmount: prev.totalSpentAmount + mapped.totalSpentAmount,
    currency: mapped.currency || prev.currency,
    isActive: true,
    updatedAt: mapped.updatedAt,
    source: prev.source ?? 'storefront',
  };
  const next = [...existing];
  next[index] = merged;
  writeJson(CUSTOMERS_KEY, next);
  return merged;
}

/** Persist a storefront checkout into the admin dashboard (browser localStorage). */
export function syncStorefrontOrderToAdminDashboard(order: StorefrontCustomerOrder): void {
  upsertLiveOrder(mapStorefrontOrderToAdmin(order));
  upsertLiveCustomerFromOrder(order);
}
