import type {
  PlaceOrderInput,
  StorefrontCustomerOrder,
  StorefrontOrderStatus,
} from '@/features/ecommerce/storefront/domain/checkout';
import { isStoreHttpEnabled } from '@/features/ecommerce/storefront/lib/api/store-http';
import {
  fetchPublicStoreOrder,
  placePublicStoreOrder,
} from '@/features/ecommerce/shared/lib/api/store-orders-api';

/**
 * Customer-facing storefront orders — HTTP only (store-frontend-binding.md §3).
 * No in-memory mock orders.
 */
export const storefrontOrdersRepository = {
  async placeOrder(input: PlaceOrderInput): Promise<StorefrontCustomerOrder> {
    if (input.lines.length === 0) {
      throw new Error('EMPTY_CART');
    }
    if (!isStoreHttpEnabled()) {
      throw new Error('STORE_HTTP_DISABLED');
    }
    return placePublicStoreOrder(input, input.accessToken);
  },

  async getByOrderNumber(
    companyId: string,
    orderNumber: string,
    options?: { phone?: string | null; accessToken?: string | null },
  ): Promise<StorefrontCustomerOrder | null> {
    if (!isStoreHttpEnabled()) return null;
    return fetchPublicStoreOrder({
      companyId,
      orderNumber,
      phone: options?.phone,
      partnerToken: options?.accessToken,
    });
  },

  async listByCompany(_companyId: string): Promise<StorefrontCustomerOrder[]> {
    // No partner order-list API in binding — guest tracking is by orderNumber+phone.
    return [];
  },

  async updateStatus(
    _companyId: string,
    _orderNumber: string,
    _status: StorefrontOrderStatus,
  ): Promise<StorefrontCustomerOrder | null> {
    return null;
  },

  async updateStatusById(
    _companyId: string,
    _orderId: string,
    _status: StorefrontOrderStatus,
  ): Promise<StorefrontCustomerOrder | null> {
    return null;
  },
};
