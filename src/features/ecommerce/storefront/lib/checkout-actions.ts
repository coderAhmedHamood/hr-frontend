'use server';

import type {
  PlaceOrderInput,
  StorefrontCustomerOrder,
  StorefrontOrderStatus,
} from '@/features/ecommerce/storefront/domain/checkout';
import { storefrontOrdersRepository } from '@/features/ecommerce/storefront/lib/repositories/storefront-orders-repository';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { OrderStatus } from '@/features/ecommerce/domain/types/order';

export async function placeStorefrontOrder(
  input: Omit<PlaceOrderInput, 'companyId'>,
): Promise<StorefrontCustomerOrder> {
  const companyId = getStorefrontCompanyId();
  const address = input.address;

  if (
    !address.fullName.trim() ||
    !address.phone.trim() ||
    !address.city.trim() ||
    !address.district.trim() ||
    !address.street.trim()
  ) {
    throw new Error('INVALID_ADDRESS');
  }

  if (input.lines.length === 0) {
    throw new Error('EMPTY_CART');
  }

  return storefrontOrdersRepository.placeOrder({
    ...input,
    companyId,
    address: {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      city: address.city.trim(),
      district: address.district.trim(),
      street: address.street.trim(),
      notes: address.notes?.trim() || undefined,
    },
  });
}

export async function getStorefrontOrderByNumber(
  orderNumber: string,
): Promise<StorefrontCustomerOrder | null> {
  const companyId = getStorefrontCompanyId();
  return storefrontOrdersRepository.getByOrderNumber(companyId, orderNumber);
}

export async function getStorefrontOrdersByNumbers(
  orderNumbers: string[],
): Promise<StorefrontCustomerOrder[]> {
  const companyId = getStorefrontCompanyId();
  const unique = [...new Set(orderNumbers.map((n) => n.trim()).filter(Boolean))];
  const orders: StorefrontCustomerOrder[] = [];
  for (const orderNumber of unique) {
    const order = await storefrontOrdersRepository.getByOrderNumber(companyId, orderNumber);
    if (order) orders.push(order);
  }
  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function toStorefrontStatus(status: OrderStatus): StorefrontOrderStatus {
  if (status === 'refunded') return 'cancelled';
  return status;
}

/** Sync dashboard status changes onto the customer tracking page. */
export async function syncStorefrontOrderStatus(input: {
  orderId?: string;
  orderNumber?: string;
  status: OrderStatus;
}): Promise<StorefrontCustomerOrder | null> {
  const companyId = getStorefrontCompanyId();
  const status = toStorefrontStatus(input.status);

  if (input.orderNumber?.trim()) {
    const byNumber = await storefrontOrdersRepository.updateStatus(
      companyId,
      input.orderNumber.trim(),
      status,
    );
    if (byNumber) return byNumber;
  }

  if (input.orderId?.trim()) {
    return storefrontOrdersRepository.updateStatusById(companyId, input.orderId.trim(), status);
  }

  return null;
}
