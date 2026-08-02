import { resolveOrderPaymentMethod } from '@/features/ecommerce/domain/constants/order-status';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  Order,
  OrderListQuery,
  SaveOrderLineAllocationsInput,
  ShipOrderLineInput,
  UpdateOrderPaymentStatusInput,
  UpdateOrderStatusInput,
} from '@/features/ecommerce/domain/types/order';
import {
  fetchAdminStoreOrder,
  fetchAdminStoreOrders,
  saveAdminStoreLineAllocations,
  shipAdminStoreLine,
  storeOrdersHttpEnabled,
  updateAdminStoreOrderPayment,
  updateAdminStoreOrderStatus,
} from '@/features/ecommerce/shared/lib/api/store-orders-api';

function normalizeOrderPayment(order: Order): Order {
  return {
    ...order,
    paymentMethod: resolveOrderPaymentMethod(order),
    paymentStatus: order.paymentStatus ?? 'pending',
  };
}

function assertStoreHttp(): void {
  if (!storeOrdersHttpEnabled()) {
    throw new Error('STORE_HTTP_DISABLED');
  }
}

/** Admin orders — HTTP only (store-frontend-binding.md). No mock / localStorage. */
export const ordersApi = {
  async getAll(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    assertStoreHttp();
    const page = await fetchAdminStoreOrders(query);
    const items = await Promise.all(
      page.items.map(async (item) => {
        const detail = await fetchAdminStoreOrder(query.companyId, item.id);
        return normalizeOrderPayment(detail ?? item);
      }),
    );
    return { ...page, items };
  },

  async getById(companyId: string, id: string) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, id);
    return order ? normalizeOrderPayment(order) : null;
  },

  async updateStatus(companyId: string, id: string, input: UpdateOrderStatusInput) {
    assertStoreHttp();
    return normalizeOrderPayment(await updateAdminStoreOrderStatus(companyId, id, input));
  },

  async updatePaymentStatus(companyId: string, id: string, input: UpdateOrderPaymentStatusInput) {
    assertStoreHttp();
    return normalizeOrderPayment(await updateAdminStoreOrderPayment(companyId, id, input));
  },

  async saveLineAllocations(companyId: string, orderId: string, input: SaveOrderLineAllocationsInput) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');
    const line = order.items.find((item) => item.productId === input.productId);
    if (!line) throw new Error('بند الطلب غير موجود.');
    if (!line.lineId) {
      throw new Error('معرّف بند الطلب غير متوفر. حدّث الصفحة ثم أعد المحاولة.');
    }
    return normalizeOrderPayment(
      await saveAdminStoreLineAllocations(companyId, orderId, line.lineId, input),
    );
  },

  async shipLine(companyId: string, orderId: string, input: ShipOrderLineInput) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');
    const line = order.items.find((item) => item.productId === input.productId);
    if (!line) throw new Error('بند الطلب غير موجود.');
    if (!line.lineId) {
      throw new Error('معرّف بند الطلب غير متوفر. حدّث الصفحة ثم أعد المحاولة.');
    }
    return normalizeOrderPayment(await shipAdminStoreLine(companyId, orderId, line.lineId, input));
  },
};
