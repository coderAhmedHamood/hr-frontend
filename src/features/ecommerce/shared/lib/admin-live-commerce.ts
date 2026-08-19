/**
 * Admin live-commerce localStorage bridge removed (store-frontend-binding.md).
 * Orders/customers come from HTTP APIs only.
 */

import type { Customer } from '@/features/ecommerce/domain/types/customer';
import type { Order } from '@/features/ecommerce/domain/types/order';
import type { StorefrontCustomerOrder } from '@/features/ecommerce/storefront/domain/checkout';

export function listLiveOrders(): Order[] {
  return [];
}

export function listLiveCustomers(): Customer[] {
  return [];
}

export function upsertLiveOrder(_order: Order): void {
  // no-op
}

export function syncStorefrontOrderToAdminDashboard(_order: StorefrontCustomerOrder): void {
  // no-op — admin reads orders from Nest store APIs
}
