import { resolveOrderPaymentMethod } from '@/features/ecommerce/domain/constants/order-status';
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  CreateStoreOrderAttachmentInput,
  Order,
  OrderLineItem,
  OrderListQuery,
  OrderStatus,
  SaveOrderLineAllocationsInput,
  ShipOrderLineInput,
  UpdateOrderLineShipStatusInput,
  UpdateOrderPaymentStatusInput,
  UpdateOrderStaffNoteInput,
  UpdateOrderStatusInput,
  UpdateStoreOrderAttachmentInput,
} from '@/features/ecommerce/domain/types/order';
import {
  addAdminStoreOrderAttachment,
  deleteAdminStoreOrderAttachment,
  updateAdminStoreOrderAttachment,
  fetchAdminStoreOrder,
  fetchAdminStoreOrders,
  saveAdminStoreLineAllocations,
  shipAdminStoreLine,
  storeOrdersHttpEnabled,
  updateAdminStoreLineShipStatus,
  updateAdminStoreOrderPayment,
  updateAdminStoreOrderStaffNote,
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

function resolveOrderLine(
  order: Order,
  input: { productId: string; lineId?: string },
): OrderLineItem {
  const line = input.lineId
    ? order.items.find((item) => item.lineId === input.lineId)
    : order.items.find((item) => item.productId === input.productId);
  if (!line) throw new Error('بند الطلب غير موجود.');
  if (!line.lineId) {
    throw new Error('معرّف بند الطلب غير متوفر. حدّث الصفحة ثم أعد المحاولة.');
  }
  return line;
}

/**
 * Admin orders — HTTP only (store-frontend-binding.md). No mock / localStorage.
 *
 * Stock is entirely on the backend:
 * - without the store-stock-sync bridge (the store's own quantity): deducted
 *   when the order is placed;
 * - with it (selling from inventory, phase 4): reserved when the order is
 *   placed and issued when its status becomes shipped (from the line
 *   allocations, else the product's default location);
 * - cancelled / refunded: returned or released, once.
 */
export const ordersApi = {
  /** List page only (no per-row detail fetch). Use for partner panels / filters. */
  async list(query: OrderListQuery): Promise<PaginatedResult<Order>> {
    assertStoreHttp();
    const page = await fetchAdminStoreOrders(query);
    return {
      ...page,
      items: page.items.map(normalizeOrderPayment),
    };
  },

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
    const order = await fetchAdminStoreOrder(companyId, id);
    if (!order) throw new Error('الطلب غير موجود.');

    if (order.status === input.status) {
      return normalizeOrderPayment(order);
    }

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
    const line = resolveOrderLine(order, input);
    return normalizeOrderPayment(
      await saveAdminStoreLineAllocations(companyId, orderId, line.lineId!, input),
    );
  },

  /** تحديث حالة شحن البند فقط — الخصم مرتبط بحالة الطلب «تم الشحن». */
  async shipLine(companyId: string, orderId: string, input: ShipOrderLineInput) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');
    const line = resolveOrderLine(order, input);
    if (line.shipStatus === 'shipped') {
      return normalizeOrderPayment(order);
    }

    return normalizeOrderPayment(await shipAdminStoreLine(companyId, orderId, line.lineId!, input));
  },

  async updateLineShipStatus(
    companyId: string,
    orderId: string,
    input: UpdateOrderLineShipStatusInput,
  ) {
    assertStoreHttp();
    const order = await fetchAdminStoreOrder(companyId, orderId);
    if (!order) throw new Error('الطلب غير موجود.');
    const line = resolveOrderLine(order, input);
    if (line.shipStatus === input.shipStatus) {
      return normalizeOrderPayment(order);
    }
    return normalizeOrderPayment(
      await updateAdminStoreLineShipStatus(
        companyId,
        orderId,
        line.lineId!,
        input.shipStatus,
        input.note,
      ),
    );
  },

  async addAttachment(
    companyId: string,
    orderId: string,
    input: CreateStoreOrderAttachmentInput,
  ) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await addAdminStoreOrderAttachment(companyId, orderId, input),
    );
  },

  async updateAttachment(
    companyId: string,
    orderId: string,
    attachmentId: string,
    input: UpdateStoreOrderAttachmentInput,
  ) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await updateAdminStoreOrderAttachment(companyId, orderId, attachmentId, input),
    );
  },

  async removeAttachment(companyId: string, orderId: string, attachmentId: string) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await deleteAdminStoreOrderAttachment(companyId, orderId, attachmentId),
    );
  },

  async updateStaffNote(companyId: string, orderId: string, input: UpdateOrderStaffNoteInput) {
    assertStoreHttp();
    return normalizeOrderPayment(
      await updateAdminStoreOrderStaffNote(companyId, orderId, input),
    );
  },
};
